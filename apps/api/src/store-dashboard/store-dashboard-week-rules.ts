import {
  growthPercent,
  ratioOf,
  valuesByPeriod,
  type MonthAmount,
  type StoreDashboardAggregation,
  type StoreKpiValue,
} from './store-dashboard-rules.js';

/**
 * Rules of the weekly store dashboard (ADR-071). A week runs Monday to Sunday and belongs to no
 * month: a week across two months stays whole. Weeks are analysis only; the official KPI period
 * is the month (docs/BUSINESS_RULES.md).
 */

/** The ranges the weekly view offers: how many finished weeks it shows and averages. */
export const DASHBOARD_WEEK_COUNTS = [4, 8, 12, 16, 20, 24] as const;
export const DEFAULT_DASHBOARD_WEEKS = 12;

/** Weeks every refresh rewrites: all ranges with room to spare; older rows stay as they are. */
export const WEEK_REFRESH_WEEKS = 60;

export const WEEK_STATUSES = ['complete', 'inProgress'] as const;

export type WeekStatus = (typeof WEEK_STATUSES)[number];

/** One week of one store KPI: a `dbo.kpi_store_week_values` row, or the measured conversion. */
export interface StoreWeekValue extends StoreKpiValue {
  /** The Monday of the week, `YYYY-MM-DD`. */
  weekStart: string;
}

export interface WeekComparison {
  weekStart: string;
  weekEnd: string;
  status: WeekStatus;
  /** Null when the store had no sales documents that week (no count for the visitor KPI). */
  value: number | null;
  /** The week before; only for a finished week. */
  previousWeek: number | null;
  /** Change from the week before; needs a positive value there. */
  previousWeekGrowthPercent: number | null;
  /** Change from the range's average; only for a finished week, needs a positive average. */
  averageGrowthPercent: number | null;
}

export interface WeekSeriesComparison {
  /** The average of the range's finished weeks that have a value. */
  average: number | null;
  /** How many weeks that average covers. */
  averageWeeks: number;
  weeks: WeekComparison[];
}

/** `date` (`YYYY-MM-DD`) moved by `days`, on the calendar: no time zone is involved. */
export function addDays(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00Z`);

  moved.setUTCDate(moved.getUTCDate() + days);

  return moved.toISOString().slice(0, 10);
}

/** The Monday of the week `date` falls in. */
export function weekStartOf(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

  return addDays(date, -((weekday + 6) % 7));
}

/** The days of a week before `today`: all seven once it has ended (ADR-052's "before today"). */
export function weekDaysBefore(weekStart: string, today: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).filter(
    (day) => day < today,
  );
}

/** The weeks every refresh rewrites, the running one last; `before` is an exclusive end. */
export function weekRefreshWindow(today: string): {
  from: string;
  lastWeek: string;
  before: string;
} {
  const lastWeek = weekStartOf(today);

  return {
    from: addDays(lastWeek, -7 * (WEEK_REFRESH_WEEKS - 1)),
    lastWeek,
    before: addDays(lastWeek, 7),
  };
}

/** `count` finished weeks and the running one after them, as Mondays, oldest first. */
export function shownWeeks(currentWeek: string, count: number): string[] {
  return Array.from({ length: count + 1 }, (_, index) =>
    addDays(currentWeek, -7 * (count - index)),
  );
}

/** The earliest week needed: the one the oldest shown week is compared with. */
export function firstComparedWeek(weeks: readonly string[]): string {
  return addDays(weeks[0] ?? '', -7);
}

/** Weekly amounts (Monday → amount); stores add up as in `valuesByPeriod`. */
export function weeklyValues(
  rows: readonly StoreWeekValue[],
  kpiCode: string,
  currency: string | null,
  storeNr: number | null,
  aggregation: StoreDashboardAggregation,
): Map<string, MonthAmount> {
  return valuesByPeriod(rows, (row) => row.weekStart, kpiCode, currency, storeNr, aggregation);
}

/**
 * The average of the given amounts. A week without a value (a closed store, no entered counts)
 * is left out rather than counted as zero, like the months of the target reports. A rate adds
 * its parts first.
 */
function averageOf(
  amounts: readonly MonthAmount[],
  aggregation: StoreDashboardAggregation,
): number | null {
  if (amounts.length === 0) {
    return null;
  }

  return aggregation === 'ratio'
    ? ratioOf(amounts)
    : amounts.reduce((sum, amount) => sum + amount.value, 0) / amounts.length;
}

/**
 * The shown weeks with their comparisons and the average of the finished ones. The running week
 * is shown but neither compared nor averaged: it is only partly over. `values` may hold the
 * week before the first one, which that week is compared with.
 */
export function compareWeeks(
  values: ReadonlyMap<string, MonthAmount>,
  weeks: readonly string[],
  currentWeek: string,
  aggregation: StoreDashboardAggregation,
): WeekSeriesComparison {
  const amounts = weeks.flatMap((weekStart) => {
    const amount = weekStart === currentWeek ? undefined : values.get(weekStart);

    return amount ? [amount] : [];
  });
  const average = averageOf(amounts, aggregation);

  return {
    average,
    averageWeeks: amounts.length,
    weeks: weeks.map((weekStart) => {
      const status: WeekStatus = weekStart === currentWeek ? 'inProgress' : 'complete';
      const value = values.get(weekStart)?.value ?? null;
      const complete = status === 'complete';
      const previousWeek = complete ? (values.get(addDays(weekStart, -7))?.value ?? null) : null;

      return {
        weekStart,
        weekEnd: addDays(weekStart, 6),
        status,
        value,
        previousWeek,
        previousWeekGrowthPercent: growthPercent(value, previousWeek),
        averageGrowthPercent: complete ? growthPercent(value, average) : null,
      };
    }),
  };
}
