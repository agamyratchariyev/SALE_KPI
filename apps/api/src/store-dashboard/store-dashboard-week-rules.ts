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

export const MIN_DASHBOARD_WEEKS = 4;
export const DEFAULT_DASHBOARD_WEEKS = 13;
export const MAX_DASHBOARD_WEEKS = 53;

/** The weeks a finished week is measured against, besides the one right before it. */
export const BASELINE_WEEKS = 4;

/** Every week the dashboard can show or compare with, plus the running one's margin. */
export const WEEK_REFRESH_WEEKS = MAX_DASHBOARD_WEEKS + BASELINE_WEEKS + 3;

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
  /** The four weeks before, averaged; only when all four have a value. */
  fourWeekAverage: number | null;
  /** Change from that average; needs a positive average. */
  fourWeekGrowthPercent: number | null;
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

/** `count` Mondays ending with the running week, oldest first. */
export function shownWeeks(currentWeek: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    addDays(currentWeek, -7 * (count - 1 - index)),
  );
}

/** The earliest week the shown ones are compared with. */
export function firstBaselineWeek(weeks: readonly string[]): string {
  return addDays(weeks[0] ?? '', -7 * BASELINE_WEEKS);
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
 * The average of the four weeks before `weekStart`. A week without a value (a closed store, no
 * entered counts) makes the baseline unreliable, so it gives none. A rate adds its parts first.
 */
function fourWeekAverage(
  values: ReadonlyMap<string, MonthAmount>,
  weekStart: string,
  aggregation: StoreDashboardAggregation,
): number | null {
  const amounts = Array.from({ length: BASELINE_WEEKS }, (_, index) =>
    values.get(addDays(weekStart, -7 * (index + 1))),
  ).filter((amount) => amount !== undefined);

  if (amounts.length < BASELINE_WEEKS) {
    return null;
  }

  return aggregation === 'ratio'
    ? ratioOf(amounts)
    : amounts.reduce((sum, amount) => sum + amount.value, 0) / BASELINE_WEEKS;
}

/**
 * Each shown week with its comparisons. The running week is shown but never compared: it is
 * only partly over. `values` may hold earlier weeks, which the comparisons read.
 */
export function compareWeeks(
  values: ReadonlyMap<string, MonthAmount>,
  weeks: readonly string[],
  currentWeek: string,
  aggregation: StoreDashboardAggregation,
): WeekComparison[] {
  return weeks.map((weekStart) => {
    const status: WeekStatus = weekStart === currentWeek ? 'inProgress' : 'complete';
    const value = values.get(weekStart)?.value ?? null;
    const complete = status === 'complete';
    const previousWeek = complete ? (values.get(addDays(weekStart, -7))?.value ?? null) : null;
    const average = complete ? fourWeekAverage(values, weekStart, aggregation) : null;

    return {
      weekStart,
      weekEnd: addDays(weekStart, 6),
      status,
      value,
      previousWeek,
      previousWeekGrowthPercent: growthPercent(value, previousWeek),
      fourWeekAverage: average,
      fourWeekGrowthPercent: growthPercent(value, average),
    };
  });
}
