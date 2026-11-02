import { conversionRate } from '../kpi-results/conversion-rules.js';

/**
 * Rules of the store dashboard (ADR-061, ADR-065): which KPIs it shows, which months it keeps
 * fresh, and how a calendar year is compared with the year before, month by month.
 */

/**
 * The store KPIs with a month function: #1–#6 from Tiger (`dbo.kpi_month_values`) and #16
 * from the entered visitor counts (`dbo.kpi_month_visitor_values`, ADR-064).
 */
export const STORE_DASHBOARD_MONTH_VALUE_CODES = [
  'STORE_SALES',
  'STORE_RECEIPTS',
  'STORE_CUSTOMERS',
  'STORE_NEW_CUSTOMERS',
  'STORE_RETURNING_CUSTOMERS',
  'STORE_PRODUCT_VARIETY',
  'STORE_VISITOR_COUNT',
] as const;

/** #7, measured by the refresh job with the calculation's rules (conversion-rules.ts). */
export const STORE_DASHBOARD_CONVERSION_CODE = 'STORE_CONVERSION';

/** Every KPI the dashboard shows; item group sales (#8) needs a group choice it has not. */
export const STORE_DASHBOARD_KPI_CODES = [
  ...STORE_DASHBOARD_MONTH_VALUE_CODES,
  STORE_DASHBOARD_CONVERSION_CODE,
] as const;

export type StoreDashboardKpiCode = (typeof STORE_DASHBOARD_KPI_CODES)[number];

/**
 * How the months of a period, and the stores of "all stores", add up. Sales, receipts, new
 * customers (a customer is new once in the firm's history) and visitors add up exactly.
 * Customers, returning customers and product variety are distinct per month, so their sum
 * would count the same customer or item again; the period shows their monthly average.
 * Growth is the same either way, because both years are compared over the same months.
 * The conversion is a rate: its receipts and visitors are added up first, then divided
 * (`ratio`, docs/BUSINESS_RULES.md "Dönüşüm").
 */
export const STORE_DASHBOARD_AGGREGATION = {
  STORE_SALES: 'sum',
  STORE_RECEIPTS: 'sum',
  STORE_CUSTOMERS: 'average',
  STORE_NEW_CUSTOMERS: 'sum',
  STORE_RETURNING_CUSTOMERS: 'average',
  STORE_PRODUCT_VARIETY: 'average',
  STORE_VISITOR_COUNT: 'sum',
  STORE_CONVERSION: 'ratio',
} as const satisfies Record<StoreDashboardKpiCode, StoreDashboardAggregation>;

export const STORE_DASHBOARD_AGGREGATIONS = ['sum', 'average', 'ratio'] as const;

export type StoreDashboardAggregation = (typeof STORE_DASHBOARD_AGGREGATIONS)[number];

export const MONTH_STATUSES = ['complete', 'inProgress', 'upcoming'] as const;

export type MonthStatus = (typeof MONTH_STATUSES)[number];

/** One month of one store KPI: a `dbo.kpi_month_values` row, or the measured conversion. */
export interface StoreMonthValue {
  storeNr: number;
  /** `YYYY-MM-01`. */
  monthStart: string;
  kpiCode: string;
  currency: string | null;
  value: number;
  /** Rates only (the conversion): receipts; null for every other KPI. */
  numerator: number | null;
  /** Rates only: visitors, always positive; null for every other KPI. */
  denominator: number | null;
}

/** A month's value with, for a rate, the parts it divides. */
export interface MonthAmount {
  value: number;
  parts: { numerator: number; denominator: number } | null;
}

export interface StoredStoreMonthValue extends StoreMonthValue {
  id: string;
}

export interface MonthComparison {
  /** 1–12. */
  month: number;
  status: MonthStatus;
  /** The selected year; null when the store had no sales documents that month. */
  current: number | null;
  /** The year before. */
  previous: number | null;
  /** Only for a finished month with a positive value the year before. */
  growthPercent: number | null;
  /** The month before (January: December of the year before); only for a finished month. */
  previousMonth: number | null;
  /** Change from the month before; only for a finished month with a positive month before. */
  previousMonthGrowthPercent: number | null;
}

export interface ComparisonSummary {
  /** Finished months with values in both years; the growth is measured over these. */
  comparableMonths: number[];
  current: number | null;
  previous: number | null;
  difference: number | null;
  growthPercent: number | null;
  /** Every finished month of the selected year that has a value. */
  currentYearValue: number | null;
  currentYearMonths: number;
  /** Every month of the year before that has a value. */
  previousYearValue: number | null;
  previousYearMonths: number;
}

export interface SeriesComparison {
  months: MonthComparison[];
  summary: ComparisonSummary;
}

/** The months every refresh rewrites: January of last year through the current month. */
export function refreshWindow(today: string): { from: string; to: string } {
  const year = Number(today.slice(0, 4));

  return { from: `${String(year - 1)}-01-01`, to: `${today.slice(0, 7)}-01` };
}

/** `YYYY-MM` of a year and month. */
export function monthKey(year: number, month: number): string {
  return `${String(year)}-${String(month).padStart(2, '0')}`;
}

/** Whether a month has ended, is running (`currentMonth`, `YYYY-MM`) or lies ahead. */
export function monthStatus(year: number, month: number, currentMonth: string): MonthStatus {
  const key = monthKey(year, month);

  if (key < currentMonth) {
    return 'complete';
  }

  return key === currentMonth ? 'inProgress' : 'upcoming';
}

/** Change from `previous` to `current` in percent, one decimal; null without a positive base. */
export function growthPercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous <= 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** The parts added up, divided; null when no amount has them. */
function ratioOf(amounts: readonly MonthAmount[]): number | null {
  let numerator = 0;
  let denominator = 0;

  for (const amount of amounts) {
    numerator += amount.parts?.numerator ?? 0;
    denominator += amount.parts?.denominator ?? 0;
  }

  return conversionRate(numerator, denominator);
}

function aggregate(
  amounts: readonly MonthAmount[],
  aggregation: StoreDashboardAggregation,
): number | null {
  if (amounts.length === 0) {
    return null;
  }

  if (aggregation === 'ratio') {
    return ratioOf(amounts);
  }

  const total = amounts.reduce((sum, amount) => sum + amount.value, 0);

  return aggregation === 'sum' ? total : total / amounts.length;
}

/**
 * Compares `year` with the year before, month by month. `values` holds one amount per month
 * (`YYYY-MM`); a missing month had no sales documents (no visitor count for the visitor KPIs).
 * The running month is shown but never compared or counted: it is only partly over. A finished
 * month is also compared with the month before it, January with December of the year before.
 */
export function compareYears(
  values: ReadonlyMap<string, MonthAmount>,
  year: number,
  currentMonth: string,
  aggregation: StoreDashboardAggregation,
): SeriesComparison {
  const months: MonthComparison[] = [];
  const currentAmounts = new Map<number, MonthAmount>();
  const previousAmounts = new Map<number, MonthAmount>();

  for (let month = 1; month <= 12; month += 1) {
    const status = monthStatus(year, month, currentMonth);
    const current = status === 'upcoming' ? undefined : values.get(monthKey(year, month));
    const previous = values.get(monthKey(year - 1, month));
    const monthBefore =
      status === 'complete'
        ? values.get(month === 1 ? monthKey(year - 1, 12) : monthKey(year, month - 1))
        : undefined;

    if (current) {
      currentAmounts.set(month, current);
    }

    if (previous) {
      previousAmounts.set(month, previous);
    }

    months.push({
      month,
      status,
      current: current?.value ?? null,
      previous: previous?.value ?? null,
      growthPercent:
        status === 'complete'
          ? growthPercent(current?.value ?? null, previous?.value ?? null)
          : null,
      previousMonth: monthBefore?.value ?? null,
      previousMonthGrowthPercent: growthPercent(current?.value ?? null, monthBefore?.value ?? null),
    });
  }

  const amountsOf = (amounts: Map<number, MonthAmount>, entries: readonly MonthComparison[]) =>
    entries.flatMap((entry) => {
      const amount = amounts.get(entry.month);

      return amount ? [amount] : [];
    });
  const comparable = months.filter(
    (entry) => entry.status === 'complete' && entry.current !== null && entry.previous !== null,
  );
  const current = aggregate(amountsOf(currentAmounts, comparable), aggregation);
  const previous = aggregate(amountsOf(previousAmounts, comparable), aggregation);
  const finished = months.filter((entry) => entry.status === 'complete' && entry.current !== null);
  const previousYear = months.filter((entry) => entry.previous !== null);

  return {
    months,
    summary: {
      comparableMonths: comparable.map((entry) => entry.month),
      current,
      previous,
      difference: current !== null && previous !== null ? current - previous : null,
      growthPercent: growthPercent(current, previous),
      currentYearValue: aggregate(amountsOf(currentAmounts, finished), aggregation),
      currentYearMonths: finished.length,
      previousYearValue: aggregate(amountsOf(previousAmounts, previousYear), aggregation),
      previousYearMonths: previousYear.length,
    },
  };
}

/**
 * Monthly amounts (`YYYY-MM` → amount) of one KPI and currency: one store, or with
 * `storeNr` null every store added together. Adding stores is exact for sales, receipts, new
 * customers and visitors; a customer who shopped in two stores counts twice in the other
 * counts. A rate adds its parts and divides them again.
 */
export function monthlyValues(
  rows: readonly StoreMonthValue[],
  kpiCode: string,
  currency: string | null,
  storeNr: number | null,
  aggregation: StoreDashboardAggregation,
): Map<string, MonthAmount> {
  const values = new Map<string, MonthAmount>();

  for (const row of rows) {
    if (
      row.kpiCode !== kpiCode ||
      row.currency !== currency ||
      (storeNr !== null && row.storeNr !== storeNr)
    ) {
      continue;
    }

    const key = row.monthStart.slice(0, 7);
    const sum = values.get(key) ?? { value: 0, parts: null };
    const parts =
      row.numerator !== null && row.denominator !== null
        ? {
            numerator: (sum.parts?.numerator ?? 0) + row.numerator,
            denominator: (sum.parts?.denominator ?? 0) + row.denominator,
          }
        : sum.parts;

    values.set(key, { value: sum.value + row.value, parts });
  }

  if (aggregation === 'ratio') {
    for (const [key, amount] of values) {
      values.set(key, { ...amount, value: ratioOf([amount]) ?? 0 });
    }
  }

  return values;
}

function rowKey(row: StoreMonthValue): string {
  return [row.monthStart, String(row.storeNr), row.kpiCode, row.currency ?? ''].join('|');
}

/** decimal(19, 4): values closer than this are the same stored value. */
const VALUE_TOLERANCE = 0.00005;

function sameNumber(left: number | null, right: number | null): boolean {
  return left === null || right === null
    ? left === right
    : Math.abs(left - right) < VALUE_TOLERANCE;
}

export interface RefreshPlan {
  inserts: StoreMonthValue[];
  updates: { id: string; value: number; numerator: number | null; denominator: number | null }[];
  deleteIds: string[];
}

/**
 * What a refresh writes: new values are inserted, changed ones updated, and values Tiger no
 * longer has (a store without documents that month) deleted. Unchanged rows are not touched.
 */
export function planRefresh(
  stored: readonly StoredStoreMonthValue[],
  fresh: readonly StoreMonthValue[],
): RefreshPlan {
  const byKey = new Map(stored.map((row) => [rowKey(row), row]));
  const plan: RefreshPlan = { inserts: [], updates: [], deleteIds: [] };

  for (const row of fresh) {
    const key = rowKey(row);
    const existing = byKey.get(key);

    if (!existing) {
      plan.inserts.push(row);
      continue;
    }

    byKey.delete(key);

    if (
      !sameNumber(existing.value, row.value) ||
      !sameNumber(existing.numerator, row.numerator) ||
      !sameNumber(existing.denominator, row.denominator)
    ) {
      plan.updates.push({
        id: existing.id,
        value: row.value,
        numerator: row.numerator,
        denominator: row.denominator,
      });
    }
  }

  plan.deleteIds = [...byKey.values()].map((row) => row.id);

  return plan;
}
