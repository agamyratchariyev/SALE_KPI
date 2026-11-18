import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';

import { getBusinessTimeZone, getFirmNumber } from '../config/environment.js';
import { KpiDefinitionEntity } from '../kpi-definitions/entities/kpi-definition.entity.js';
import { readKpiDefinitionName } from '../kpi-definitions/kpi-definition-response.js';
import { dateInZone } from '../kpi-results/conversion-rules.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import type { StoreDashboardQueryDto } from './dto/store-dashboard-query.dto.js';
import type { StoreDashboardWeeklyQueryDto } from './dto/store-dashboard-weekly-query.dto.js';
import { StoreKpiMonthValueEntity } from './entities/store-kpi-month-value.entity.js';
import { StoreKpiWeekValueEntity } from './entities/store-kpi-week-value.entity.js';
import { StoreDashboardRefreshService } from './store-dashboard-refresh.service.js';
import type {
  StoreDashboardComparisonResponse,
  StoreDashboardKpiResponse,
  StoreDashboardResponse,
  StoreDashboardWeekComparisonResponse,
  StoreDashboardWeekKpiResponse,
  StoreDashboardWeeklyResponse,
} from './store-dashboard-response.js';
import {
  STORE_DASHBOARD_AGGREGATION,
  STORE_DASHBOARD_KPI_CODES,
  compareYears,
  monthlyValues,
  type StoreDashboardKpiCode,
  type StoreMonthValue,
} from './store-dashboard-rules.js';
import {
  DEFAULT_DASHBOARD_WEEKS,
  addDays,
  compareWeeks,
  firstBaselineWeek,
  shownWeeks,
  weekStartOf,
  weeklyValues,
  type StoreWeekValue,
} from './store-dashboard-week-rules.js';

/** Sales are shown in both currencies; the counts have none. */
const SALES_CURRENCIES = ['TMT', 'USD'] as const;

/**
 * The store dashboard (ADR-061, ADR-065): a calendar year against the year before, month by
 * month, for the store KPIs #1–#7 and #16, per store and for all stores. It reads the values
 * the refresh job stored; nothing is computed from Tiger here (ADR-010). The weekly view
 * (ADR-071) reads the weekly values the same way.
 */
@Injectable()
export class StoreDashboardService {
  constructor(
    @InjectRepository(StoreKpiMonthValueEntity)
    private readonly valueRepository: Repository<StoreKpiMonthValueEntity>,
    @InjectRepository(StoreKpiWeekValueEntity)
    private readonly weekValueRepository: Repository<StoreKpiWeekValueEntity>,
    @InjectRepository(KpiDefinitionEntity)
    private readonly definitionRepository: Repository<KpiDefinitionEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(StoreDashboardRefreshService)
    private readonly refreshService: StoreDashboardRefreshService,
  ) {}

  async get(query: StoreDashboardQueryDto): Promise<StoreDashboardResponse> {
    const today = dateInZone(new Date(), getBusinessTimeZone());
    const currentYear = Number(today.slice(0, 4));
    const currentMonth = today.slice(0, 7);
    const year = query.year ?? currentYear;
    const firmNr = getFirmNumber();

    const [rows, years, definitions] = await Promise.all([
      this.valueRepository.find({
        where: {
          firmNr,
          kpiCode: In([...STORE_DASHBOARD_KPI_CODES]),
          monthStart: Between(`${String(year - 1)}-01-01`, `${String(year)}-12-01`),
        },
      }),
      this.yearsWithValues(firmNr),
      this.definitionRepository.find({ where: { code: In([...STORE_DASHBOARD_KPI_CODES]) } }),
    ]);
    const storeNrs = [...new Set(rows.map((row) => row.storeNr))].sort((a, b) => a - b);
    const stores = await this.storeNames(firmNr, storeNrs);
    const byCode = new Map(definitions.map((definition) => [definition.code, definition]));

    const kpis = STORE_DASHBOARD_KPI_CODES.flatMap((code): StoreDashboardKpiResponse[] => {
      const definition = byCode.get(code);

      return definition ? [this.toKpi(definition, code, rows, storeNrs, year, currentMonth)] : [];
    }).sort((left, right) => sortOrderOf(byCode, left.code) - sortOrderOf(byCode, right.code));

    return {
      year,
      previousYear: year - 1,
      years: [...new Set([...years, currentYear])].sort((a, b) => b - a),
      currentMonth,
      refresh: this.refreshService.status(),
      stores: storeNrs.map((nr) => ({ nr, name: stores.get(nr) ?? null })),
      kpis,
    };
  }

  /** The recent weeks of every store KPI, each against the week and the four weeks before. */
  async getWeekly(query: StoreDashboardWeeklyQueryDto): Promise<StoreDashboardWeeklyResponse> {
    const currentWeek = weekStartOf(dateInZone(new Date(), getBusinessTimeZone()));
    const weeks = shownWeeks(currentWeek, query.weeks ?? DEFAULT_DASHBOARD_WEEKS);
    const firmNr = getFirmNumber();
    const [rows, definitions] = await Promise.all([
      this.weekValueRepository.find({
        where: {
          firmNr,
          kpiCode: In([...STORE_DASHBOARD_KPI_CODES]),
          weekStart: Between(firstBaselineWeek(weeks), currentWeek),
        },
      }),
      this.definitionRepository.find({ where: { code: In([...STORE_DASHBOARD_KPI_CODES]) } }),
    ]);
    const storeNrs = [...new Set(rows.map((row) => row.storeNr))].sort((a, b) => a - b);
    const stores = await this.storeNames(firmNr, storeNrs);
    const byCode = new Map(definitions.map((definition) => [definition.code, definition]));

    const kpis = STORE_DASHBOARD_KPI_CODES.flatMap((code): StoreDashboardWeekKpiResponse[] => {
      const definition = byCode.get(code);

      return definition
        ? [this.toWeekKpi(definition, code, rows, storeNrs, weeks, currentWeek)]
        : [];
    }).sort((left, right) => sortOrderOf(byCode, left.code) - sortOrderOf(byCode, right.code));

    return {
      currentWeek,
      lastCompleteWeek: addDays(currentWeek, -7),
      refresh: this.refreshService.weeklyStatus(),
      stores: storeNrs.map((nr) => ({ nr, name: stores.get(nr) ?? null })),
      kpis,
    };
  }

  private toWeekKpi(
    definition: KpiDefinitionEntity,
    code: StoreDashboardKpiCode,
    rows: readonly StoreWeekValue[],
    storeNrs: readonly number[],
    weeks: readonly string[],
    currentWeek: string,
  ): StoreDashboardWeekKpiResponse {
    const aggregation = STORE_DASHBOARD_AGGREGATION[code];
    const currencies = definition.unit === 'money' ? SALES_CURRENCIES : [null];
    const compare = (
      currency: string | null,
      storeNr: number | null,
    ): StoreDashboardWeekComparisonResponse => ({
      storeNr,
      weeks: compareWeeks(
        weeklyValues(rows, code, currency, storeNr, aggregation),
        weeks,
        currentWeek,
        aggregation,
      ),
    });

    return {
      code,
      name: readKpiDefinitionName(definition),
      unit: definition.unit,
      aggregation,
      series: currencies.map((currency) => ({
        currency,
        total: compare(currency, null),
        stores: storeNrs.map((storeNr) => compare(currency, storeNr)),
      })),
    };
  }

  private toKpi(
    definition: KpiDefinitionEntity,
    code: StoreDashboardKpiCode,
    rows: readonly StoreMonthValue[],
    storeNrs: readonly number[],
    year: number,
    currentMonth: string,
  ): StoreDashboardKpiResponse {
    const aggregation = STORE_DASHBOARD_AGGREGATION[code];
    const currencies = definition.unit === 'money' ? SALES_CURRENCIES : [null];
    const compare = (currency: string | null, storeNr: number | null) => {
      const comparison: StoreDashboardComparisonResponse = {
        storeNr,
        ...compareYears(
          monthlyValues(rows, code, currency, storeNr, aggregation),
          year,
          currentMonth,
          aggregation,
        ),
      };

      return comparison;
    };

    return {
      code,
      name: readKpiDefinitionName(definition),
      unit: definition.unit,
      aggregation,
      series: currencies.map((currency) => ({
        currency,
        total: compare(currency, null),
        stores: storeNrs.map((storeNr) => compare(currency, storeNr)),
      })),
    };
  }

  /** Calendar years the table has values for, in the configured firm. */
  private async yearsWithValues(firmNr: number): Promise<number[]> {
    const rows = await this.valueRepository
      .createQueryBuilder('value')
      .select('DISTINCT YEAR(value.monthStart)', 'year')
      .where('value.firmNr = :firmNr', { firmNr })
      .getRawMany<{ year: number }>();

    return rows.map((row) => Number(row.year));
  }

  /** Store names from `dbo.stores` by iş yeri number; a store gone from Tiger keeps its number. */
  private async storeNames(
    firmNr: number,
    nrs: readonly number[],
  ): Promise<Map<number, string | null>> {
    if (nrs.length === 0) {
      return new Map();
    }

    const stores = await this.storeRepository.find({ where: { firmNr, nr: In([...nrs]) } });

    return new Map(stores.map((store) => [store.nr, store.name]));
  }
}

function sortOrderOf(byCode: ReadonlyMap<string, KpiDefinitionEntity>, code: string): number {
  return byCode.get(code)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}
