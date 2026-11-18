import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  Between,
  DataSource,
  In,
  type EntityManager,
  type EntityTarget,
  type FindOptionsWhere,
} from 'typeorm';

import { AuditService, type AuditValues } from '../audit/audit.service.js';
import {
  getBusinessTimeZone,
  getFirmNumber,
  getStoreDashboardRefreshIntervalMinutes,
} from '../config/environment.js';
import {
  calculateConversion,
  consideredDays,
  dateInZone,
} from '../kpi-results/conversion-rules.js';
import { StoreKpiMonthValueEntity } from './entities/store-kpi-month-value.entity.js';
import { StoreKpiWeekValueEntity } from './entities/store-kpi-week-value.entity.js';
import {
  STORE_DASHBOARD_CONVERSION_CODE,
  STORE_DASHBOARD_MONTH_VALUE_CODES,
  planRefresh,
  planValueRefresh,
  refreshWindow,
  type RefreshPlan,
  type StoreKpiValue,
  type StoreMonthValue,
} from './store-dashboard-rules.js';
import {
  weekDaysBefore,
  weekRefreshWindow,
  weekStartOf,
  type StoreWeekValue,
} from './store-dashboard-week-rules.js';

export const STORE_DASHBOARD_REFRESH_JOB = 'store-dashboard-refresh';

/** SQL Server accepts at most 2,100 parameters per statement. */
const MAX_IDS_PER_STATEMENT = 1_000;

/** What the dashboard may say about the job, e.g. "updated 12 minutes ago, hourly". */
export interface StoreDashboardRefreshStatus {
  /** 0 when the job is switched off. */
  intervalMinutes: number;
  /** End of the last finished run since the API started; null before the first one. */
  lastRunAt: Date | null;
}

interface RefreshResult {
  /** Months or weeks the fresh values cover. */
  periods: number;
  inserted: number;
  updated: number;
  deleted: number;
}

/** What the conversion is measured from: the entered visitor counts and the day's receipts. */
interface ConversionInputs {
  counts: { storeId: number; storeNr: number; day: string; visitors: number }[];
  /** `${storeNr}|${day}` → sales receipts. */
  receipts: Map<string, number>;
  /** `${storeId}|${day}` → visitors. */
  visitors: Map<string, number>;
}

/**
 * Keeps `store_kpi_month_values` (ADR-061) and `store_kpi_week_values` (ADR-071) current, so
 * the store dashboard reads stored values and never computes from Tiger per request (ADR-010).
 * Each run reads January of last year through the current month from `dbo.kpi_month_values` and
 * `dbo.kpi_month_visitor_values`, the recent weeks from `dbo.kpi_store_week_values`, and
 * measures the conversion of each store and period with the calculation's rules (ADR-065);
 * older periods keep the values they were last refreshed with.
 *
 * - Runs once when the API starts, then every `STORE_DASHBOARD_REFRESH_INTERVAL_MINUTES`
 *   (default 60, 0 = off).
 * - A run never overlaps the previous one; a tick that finds a run in progress is dropped.
 * - The rows are derived data written by the system on every run, like refresh token
 *   rotation: they are stamped (NULL actor) but not logged one by one (ADR-036, ADR-061).
 * - Like the other scheduled jobs, it assumes a single API replica (ADR-014).
 */
@Injectable()
export class StoreDashboardRefreshService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(StoreDashboardRefreshService.name);
  private readonly intervalMinutes = getStoreDashboardRefreshIntervalMinutes();
  private running = false;
  private lastRunAt: Date | null = null;
  private lastWeekRunAt: Date | null = null;

  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(SchedulerRegistry) private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    if (this.intervalMinutes === 0) {
      this.logger.log(
        'Store dashboard refresh is off (STORE_DASHBOARD_REFRESH_INTERVAL_MINUTES=0).',
      );
      return;
    }

    const handle = setInterval(() => {
      void this.runOnce();
    }, this.intervalMinutes * 60_000);

    this.schedulerRegistry.addInterval(STORE_DASHBOARD_REFRESH_JOB, handle);
    this.logger.log(`Store dashboard values are refreshed every ${this.intervalMinutes} minutes.`);
    // The first run does not wait an interval: after a deploy the dashboard fills at once.
    void this.runOnce();
  }

  onApplicationShutdown(): void {
    if (this.schedulerRegistry.doesExist('interval', STORE_DASHBOARD_REFRESH_JOB)) {
      this.schedulerRegistry.deleteInterval(STORE_DASHBOARD_REFRESH_JOB);
    }
  }

  status(): StoreDashboardRefreshStatus {
    return { intervalMinutes: this.intervalMinutes, lastRunAt: this.lastRunAt };
  }

  /** The same for the weekly values, which a run writes after the monthly ones. */
  weeklyStatus(): StoreDashboardRefreshStatus {
    return { intervalMinutes: this.intervalMinutes, lastRunAt: this.lastWeekRunAt };
  }

  /** One refresh; returns false when a refresh was already running. */
  async runOnce(now: Date = new Date()): Promise<boolean> {
    if (this.running) {
      this.logger.warn('Previous store dashboard refresh is still running; this tick is skipped.');
      return false;
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      const today = dateInZone(now, getBusinessTimeZone());
      const window = refreshWindow(today);
      const result = await this.refresh(window.from, window.to, today);

      this.lastRunAt = new Date();
      this.logger.log(
        `Store dashboard refresh: ${result.periods} months, ${result.inserted} added, ${result.updated} changed, ${result.deleted} removed, ${Date.now() - startedAt} ms.`,
      );

      // After the months, so a failure here leaves the monthly dashboard up to date.
      const weeksStartedAt = Date.now();
      const weeks = await this.refreshWeeks(today);

      this.lastWeekRunAt = new Date();
      this.logger.log(
        `Store dashboard weekly refresh: ${weeks.periods} weeks, ${weeks.inserted} added, ${weeks.updated} changed, ${weeks.deleted} removed, ${Date.now() - weeksStartedAt} ms.`,
      );
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Store dashboard refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    } finally {
      this.running = false;
    }
  }

  private async refresh(from: string, to: string, today: string): Promise<RefreshResult> {
    const firmNr = getFirmNumber();
    const [monthValues, conversions] = await Promise.all([
      this.readMonthValues(from, to),
      this.measureConversions(firmNr, from, today),
    ]);
    const fresh = [...monthValues, ...conversions];

    return this.dataSource.transaction(async (manager) => {
      const stored = await manager.find(StoreKpiMonthValueEntity, {
        where: { firmNr, monthStart: Between(from, to) },
      });
      const plan = planRefresh(stored, fresh);

      await this.writePlan(manager, StoreKpiMonthValueEntity, plan, firmNr);

      return {
        periods: new Set(fresh.map((row) => row.monthStart)).size,
        inserted: plan.inserts.length,
        updated: plan.updates.length,
        deleted: plan.deleteIds.length,
      };
    });
  }

  /** The weekly values of the refresh window (ADR-071), written the way the months are. */
  private async refreshWeeks(today: string): Promise<RefreshResult> {
    const firmNr = getFirmNumber();
    const window = weekRefreshWindow(today);
    const [weekValues, conversions] = await Promise.all([
      this.readWeekValues(window.from, window.before),
      this.measureWeekConversions(firmNr, window.from, today),
    ]);
    const fresh = [...weekValues, ...conversions];

    return this.dataSource.transaction(async (manager) => {
      const stored = await manager.find(StoreKpiWeekValueEntity, {
        where: { firmNr, weekStart: Between(window.from, window.lastWeek) },
      });
      const plan = planValueRefresh<StoreWeekValue>(stored, fresh, (row) => row.weekStart);

      await this.writePlan(manager, StoreKpiWeekValueEntity, plan, firmNr);

      return {
        periods: new Set(fresh.map((row) => row.weekStart)).size,
        inserted: plan.inserts.length,
        updated: plan.updates.length,
        deleted: plan.deleteIds.length,
      };
    });
  }

  /** Writes a refresh plan; derived rows are stamped but not logged one by one (ADR-061). */
  private async writePlan<
    Entity extends StoreKpiMonthValueEntity | StoreKpiWeekValueEntity,
    Row extends StoreKpiValue,
  >(
    manager: EntityManager,
    target: EntityTarget<Entity>,
    plan: RefreshPlan<Row>,
    firmNr: number,
  ): Promise<void> {
    for (let index = 0; index < plan.deleteIds.length; index += MAX_IDS_PER_STATEMENT) {
      await this.audit.delete(
        manager,
        target,
        {
          id: In(plan.deleteIds.slice(index, index + MAX_IDS_PER_STATEMENT)),
        } as FindOptionsWhere<Entity>,
        { log: false },
      );
    }

    await this.audit.insertMany(
      manager,
      target,
      plan.inserts.map((row) => ({ ...row, firmNr }) as unknown as AuditValues<Entity>),
      { log: false },
    );

    for (const { id, ...values } of plan.updates) {
      await this.audit.update(
        manager,
        target,
        { id } as FindOptionsWhere<Entity>,
        values as AuditValues<Entity>,
        { log: false },
      );
    }
  }

  /**
   * Every store's values of the dashboard KPIs for each month from `from` to `to`, from the
   * single implementations of the measures (`dbo.kpi_month_values`, ADR-041, and
   * `dbo.kpi_month_visitor_values`, ADR-064), in one query.
   */
  private async readMonthValues(from: string, to: string): Promise<StoreMonthValue[]> {
    const codes = STORE_DASHBOARD_MONTH_VALUE_CODES.map((_, index) => `@${String(index + 2)}`);
    const rows = await this.dataSource.query<
      {
        monthStart: string;
        storeNr: number;
        kpiCode: string;
        currency: string | null;
        value: number | string;
      }[]
    >(
      `
        WITH [months] AS (
          SELECT CAST(@0 AS date) AS [month_start]
          UNION ALL
          SELECT DATEADD(month, 1, [month_start])
          FROM [months]
          WHERE [month_start] < CAST(@1 AS date)
        )
        SELECT
          CONVERT(char(10), m.[month_start], 23) AS [monthStart],
          v.[entity_ref] AS [storeNr],
          v.[kpi_code] AS [kpiCode],
          v.[currency] AS [currency],
          v.[value] AS [value]
        FROM [months] m
        CROSS APPLY (
          SELECT [kpi_code], [entity_ref], [currency], [value]
          FROM [dbo].[kpi_month_values](m.[month_start])
          UNION ALL
          SELECT [kpi_code], [entity_ref], [currency], [value]
          FROM [dbo].[kpi_month_visitor_values](m.[month_start])
        ) v
        WHERE v.[kpi_code] IN (${codes.join(', ')})
        OPTION (MAXRECURSION 100)
      `,
      [from, to, ...STORE_DASHBOARD_MONTH_VALUE_CODES],
    );

    return rows.map((row) => ({
      monthStart: row.monthStart,
      storeNr: row.storeNr,
      kpiCode: row.kpiCode,
      currency: row.currency,
      value: Number(row.value),
      numerator: null,
      denominator: null,
    }));
  }

  /** Every store's values of each week in `[from, before)` (`dbo.kpi_store_week_values`). */
  private async readWeekValues(from: string, before: string): Promise<StoreWeekValue[]> {
    const rows = await this.dataSource.query<
      {
        weekStart: string;
        storeNr: number;
        kpiCode: string;
        currency: string | null;
        value: number | string;
      }[]
    >(
      `
        SELECT
          CONVERT(char(10), [week_start], 23) AS [weekStart],
          [store_nr] AS [storeNr],
          [kpi_code] AS [kpiCode],
          [currency] AS [currency],
          [value] AS [value]
        FROM [dbo].[kpi_store_week_values](@0, @1)
      `,
      [from, before],
    );

    return rows.map((row) => ({
      weekStart: row.weekStart,
      storeNr: row.storeNr,
      kpiCode: row.kpiCode,
      currency: row.currency,
      value: Number(row.value),
      numerator: null,
      denominator: null,
    }));
  }

  /**
   * The visitor counts from `from` up to yesterday and the sales receipts of those days;
   * null when no count was entered. Today is left out: its count is not final (ADR-052).
   */
  private async readConversionInputs(
    firmNr: number,
    from: string,
    today: string,
  ): Promise<ConversionInputs | null> {
    const counts = await this.dataSource.query<ConversionInputs['counts']>(
      `
        SELECT
          v.[store_id] AS [storeId],
          CAST(s.[nr] AS int) AS [storeNr],
          CONVERT(char(10), v.[visit_date], 23) AS [day],
          v.[visitor_count] AS [visitors]
        FROM [dbo].[store_visitor_counts] v
        JOIN [dbo].[stores] s ON s.[id] = v.[store_id]
        WHERE s.[firm_nr] = @0 AND v.[visit_date] >= @1 AND v.[visit_date] < @2
      `,
      [firmNr, from, today],
    );

    if (counts.length === 0) {
      return null;
    }

    const days = counts.map((count) => count.day).sort();
    const first = days[0] ?? from;
    const last = days.at(-1) ?? from;
    // Sales receipts only: returns do not change how many customers were served (decision 19).
    const receiptRows = await this.dataSource.query<
      { storeNr: number; day: string; receipts: number }[]
    >(
      `
        SELECT
          [store_nr] AS [storeNr],
          CONVERT(char(10), [sale_date], 23) AS [day],
          COUNT(*) AS [receipts]
        FROM [dbo].[kpi_report_documents]
        WHERE [trcode] = 7
          AND [month_start] BETWEEN @0 AND @1
          AND [sale_date] BETWEEN @2 AND @3
        GROUP BY [store_nr], [sale_date]
      `,
      [`${first.slice(0, 7)}-01`, `${last.slice(0, 7)}-01`, first, last],
    );

    return {
      counts,
      receipts: new Map(
        receiptRows.map((row) => [`${String(row.storeNr)}|${row.day}`, Number(row.receipts)]),
      ),
      visitors: new Map(
        counts.map((count) => [`${String(count.storeId)}|${count.day}`, Number(count.visitors)]),
      ),
    };
  }

  /**
   * The conversion (#7) of every store and month from `from` up to yesterday, measured like
   * a plan row of that one store (conversion-rules.ts, ADR-052): only days with an entered
   * visitor count, their sales receipts over their visitors, no value below the coverage
   * rule. Receipts and visitors are kept, so stores and months add up as a rate (ADR-065).
   */
  private async measureConversions(
    firmNr: number,
    from: string,
    today: string,
  ): Promise<StoreMonthValue[]> {
    const inputs = await this.readConversionInputs(firmNr, from, today);

    if (!inputs) {
      return [];
    }

    const { counts, receipts, visitors } = inputs;
    const storeMonths = new Map(
      counts.map((count) => [
        `${String(count.storeId)}|${count.day.slice(0, 7)}`,
        { storeId: count.storeId, storeNr: count.storeNr, month: count.day.slice(0, 7) },
      ]),
    );

    return [...storeMonths.values()].flatMap(({ storeId, storeNr, month }): StoreMonthValue[] => {
      const result = calculateConversion(
        [{ storeId, storeNr }],
        consideredDays(Number(month.slice(0, 4)), Number(month.slice(5, 7)), today),
        receipts,
        visitors,
      );

      return result.value === null
        ? []
        : [
            {
              monthStart: `${month}-01`,
              storeNr,
              kpiCode: STORE_DASHBOARD_CONVERSION_CODE,
              currency: null,
              value: result.value,
              numerator: result.detail.receipts,
              denominator: result.detail.visitors,
            },
          ];
    });
  }

  /** The conversion of every store and week: the month's rules over the week's days. */
  private async measureWeekConversions(
    firmNr: number,
    from: string,
    today: string,
  ): Promise<StoreWeekValue[]> {
    const inputs = await this.readConversionInputs(firmNr, from, today);

    if (!inputs) {
      return [];
    }

    const { counts, receipts, visitors } = inputs;
    const storeWeeks = new Map(
      counts.map((count) => {
        const weekStart = weekStartOf(count.day);

        return [
          `${String(count.storeId)}|${weekStart}`,
          { storeId: count.storeId, storeNr: count.storeNr, weekStart },
        ];
      }),
    );

    return [...storeWeeks.values()].flatMap(({ storeId, storeNr, weekStart }): StoreWeekValue[] => {
      const result = calculateConversion(
        [{ storeId, storeNr }],
        weekDaysBefore(weekStart, today),
        receipts,
        visitors,
      );

      return result.value === null
        ? []
        : [
            {
              weekStart,
              storeNr,
              kpiCode: STORE_DASHBOARD_CONVERSION_CODE,
              currency: null,
              value: result.value,
              numerator: result.detail.receipts,
              denominator: result.detail.visitors,
            },
          ];
    });
  }
}
