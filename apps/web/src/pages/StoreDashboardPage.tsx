import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getStoreDashboard } from '../api/store-dashboard';
import { AppShell } from '../components/AppShell';
import { CalendarIcon, FilterSelect, StoreIcon } from '../components/FilterSelect';
import { StoreKpiIcon, storeKpiShortName } from '../components/StoreKpiIcon';
import { formatDateTime, formatMonthName, formatNumber } from '../i18n/formatters';
import { pickLocalizedText } from '../i18n/localized-text';
import { useTranslation } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import type {
  StoreDashboardComparison,
  StoreDashboardKpi,
  StoreDashboardMonth,
  StoreDashboardResponse,
} from '../types/api';

type Currency = 'TMT' | 'USD';
type Store = StoreDashboardResponse['stores'][number];
type Translate = ReturnType<typeof useTranslation>['t'];
type SortOrder = 'asc' | 'desc';
type MonthSortKey = 'month' | 'previous' | 'current' | 'difference' | 'growth';
/** Which change the chart writes above the bars. */
type ChangeBasis = 'year' | 'month';

interface MonthSort {
  key: MonthSortKey;
  order: SortOrder;
}

const CURRENCIES: Currency[] = ['TMT', 'USD'];
const CHANGE_BASES: ChangeBasis[] = ['year', 'month'];
const DEFAULT_MONTH_SORT: MonthSort = { key: 'month', order: 'asc' };
const PANEL_ID = 'store-dashboard-panel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "#1 Mağaza bazında ciro" → "#1" and the rest; KPI names carry their number (ADR-060). */
function splitCatalogName(name: string): { number: string | null; label: string } {
  const match = /^(#\d+)\s+(.+)$/.exec(name);

  return match?.[1] && match[2]
    ? { number: match[1], label: match[2] }
    : { number: null, label: name };
}

/** What a KPI is called on screen: its catalog number, full name and short name. */
function kpiNames(
  kpi: StoreDashboardKpi,
  locale: Locale,
  t: Translate,
): { number: string | null; full: string; label: string; short: string } {
  const full = pickLocalizedText(kpi.name, locale);
  const { number, label } = splitCatalogName(full);
  const shortKey = storeKpiShortName(kpi.code);

  return { number, full, label, short: shortKey ? t(shortKey) : label };
}

/** The KPI's icon on a tinted square; the emphasis follows the active tab or card. */
function KpiBadgeIcon({ code, size = 'md' }: { code: string | null; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300 ${
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
      }`}
    >
      <StoreKpiIcon code={code} className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  );
}

function monthName(month: number, locale: Locale, width: 'long' | 'short' = 'long'): string {
  const name = formatMonthName(month, locale, width);

  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** "Mart–Ağustos", or the short names when the months have a gap. */
function monthRange(months: readonly number[], locale: Locale): string {
  const first = months.at(0);
  const last = months.at(-1);

  if (first === undefined || last === undefined) {
    return '';
  }

  if (first === last) {
    return monthName(first, locale);
  }

  return last - first + 1 === months.length
    ? `${monthName(first, locale)}–${monthName(last, locale)}`
    : months.map((month) => monthName(month, locale, 'short')).join(', ');
}

function storeLabel(store: Store): string {
  return store.name ? `${String(store.nr)} · ${store.name}` : String(store.nr);
}

/** The comparison of one store (or all, `storeNr` null) in the chosen currency. */
function comparisonFor(
  kpi: StoreDashboardKpi,
  currency: Currency,
  storeNr: number | null,
): StoreDashboardComparison | null {
  const series =
    kpi.series.find((entry) => entry.currency === null || entry.currency === currency) ??
    kpi.series[0];

  if (!series) {
    return null;
  }

  return storeNr === null
    ? series.total
    : (series.stores.find((entry) => entry.storeNr === storeNr) ?? series.total);
}

/** Fraction digits of a value: rates keep two, averages one, everything else is whole. */
function valueDigits(kpi: StoreDashboardKpi): number {
  return kpi.aggregation === 'ratio' ? 2 : kpi.aggregation === 'average' ? 1 : 0;
}

/** Money with its currency, a rate as a percentage, a count as it is. */
function formatValue(
  value: number | null,
  kpi: StoreDashboardKpi,
  currency: Currency,
  locale: Locale,
  t: Translate,
): string {
  if (value === null) {
    return '—';
  }

  const text = formatNumber(value, locale, { maximumFractionDigits: valueDigits(kpi) });

  if (kpi.unit === 'percent') {
    return t('storeDashboard.percent', { value: text });
  }

  return kpi.unit === 'money' ? `${text} ${currency}` : text;
}

/** A change of a value; between two percentages it is in percentage points. */
function formatDifference(
  value: number,
  kpi: StoreDashboardKpi,
  currency: Currency,
  locale: Locale,
  t: Translate,
): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  if (kpi.unit === 'percent') {
    return (
      sign +
      t('storeDashboard.percentPoints', {
        value: formatNumber(Math.abs(value), locale, { maximumFractionDigits: valueDigits(kpi) }),
      })
    );
  }

  return sign + formatValue(Math.abs(value), kpi, currency, locale, t);
}

function formatGrowth(value: number, locale: Locale, t: Translate, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  return (
    sign +
    t('storeDashboard.percent', {
      value: formatNumber(Math.abs(value), locale, { maximumFractionDigits: digits }),
    })
  );
}

function growthTone(value: number | null): string {
  if (value === null || value === 0) {
    return 'text-slate-500 dark:text-slate-400';
  }

  return value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

function barPercent(value: number | null, max: number): number {
  return value === null || value <= 0 ? 0 : Math.max(3, (value / max) * 100);
}

function barHeight(value: number | null, max: number): string {
  return `${String(barPercent(value, max))}%`;
}

function chartMax(months: readonly StoreDashboardMonth[]): number {
  return Math.max(1, ...months.flatMap((month) => [month.current ?? 0, month.previous ?? 0]));
}

/** This year against the year before; only for a finished month with both values. */
function yearDifference(month: StoreDashboardMonth): number | null {
  return month.status === 'complete' && month.current !== null && month.previous !== null
    ? month.current - month.previous
    : null;
}

/** This month against the month before; only for a finished month with both values. */
function monthDifference(month: StoreDashboardMonth): number | null {
  return month.status === 'complete' && month.current !== null && month.previousMonth !== null
    ? month.current - month.previousMonth
    : null;
}

function monthSortValue(month: StoreDashboardMonth, key: MonthSortKey): number | null {
  switch (key) {
    case 'month':
      return month.month;
    case 'previous':
      return month.previous;
    case 'current':
      return month.current;
    case 'difference':
      return yearDifference(month);
    case 'growth':
      return month.growthPercent;
  }
}

/** The months in the chosen order; a month without the value goes last either way. */
function sortMonths(
  months: readonly StoreDashboardMonth[],
  sort: MonthSort,
): StoreDashboardMonth[] {
  return [...months].sort((left, right) => {
    const a = monthSortValue(left, sort.key);
    const b = monthSortValue(right, sort.key);

    if (a === null || b === null) {
      return a === b ? left.month - right.month : a === null ? 1 : -1;
    }

    return (sort.order === 'asc' ? a - b : b - a) || left.month - right.month;
  });
}

/** A second click on a column turns its order round; a new value column starts largest first. */
function nextMonthSort(sort: MonthSort, key: MonthSortKey): MonthSort {
  if (sort.key === key) {
    return { key, order: sort.order === 'asc' ? 'desc' : 'asc' };
  }

  return { key, order: key === 'month' ? 'asc' : 'desc' };
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function TrendArrow({ up, className = '' }: { up: boolean; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={className} fill="currentColor">
      <path d={up ? 'M6 2l4 5H2z' : 'M6 10L2 5h8z'} />
    </svg>
  );
}

/** Both arrows of a sortable column; the one of the active order is lit. */
function SortArrows({ order }: { order: SortOrder | null }) {
  const tone = (lit: boolean) =>
    lit ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-current opacity-30';

  return (
    <svg aria-hidden="true" viewBox="0 0 10 16" className="h-3.5 w-2.5 flex-shrink-0">
      <path d="M5 1l4 5H1z" className={tone(order === 'asc')} />
      <path d="M5 15L1 10h8z" className={tone(order === 'desc')} />
    </svg>
  );
}

/** A column name that sorts the months; on a right-aligned column the arrows come first. */
function SortButton({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: MonthSortKey;
  sort: MonthSort;
  onSort: (key: MonthSortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap transition hover:text-slate-900 dark:hover:text-slate-100 ${
        align === 'right' ? 'flex-row-reverse' : ''
      } ${active ? 'text-slate-900 dark:text-slate-100' : ''}`}
    >
      {label}
      <SortArrows order={active ? sort.order : null} />
    </button>
  );
}

function SortableHeader({
  align = 'left',
  ...props
}: {
  label: string;
  sortKey: MonthSortKey;
  sort: MonthSort;
  onSort: (key: MonthSortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = props.sort.key === props.sortKey;

  return (
    <th
      aria-sort={active ? (props.sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-4 font-medium ${align === 'right' ? 'text-right' : ''}`}
    >
      <SortButton {...props} align={align} />
    </th>
  );
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** A growth pill; `compact` shows nothing when there is no comparison. */
function GrowthBadge({ value, compact = false }: { value: number | null; compact?: boolean }) {
  const { t, locale } = useTranslation();

  if (value === null) {
    return compact ? null : (
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {t('storeDashboard.noGrowth')}
      </span>
    );
  }

  const tone =
    value > 0
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : value < 0
        ? 'bg-red-500/15 text-red-700 dark:text-red-300'
        : 'bg-slate-500/15 text-slate-600 dark:text-slate-300';

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}
    >
      {value === 0 ? null : <TrendArrow up={value > 0} className="h-3 w-3" />}
      {formatGrowth(value, locale, t)}
    </span>
  );
}

/** The one big number of a KPI: how much it grew. */
function GrowthHeadline({ value, large = false }: { value: number | null; large?: boolean }) {
  const { t, locale } = useTranslation();

  if (value === null) {
    return (
      <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">
        {t('storeDashboard.noGrowth')}
      </p>
    );
  }

  return (
    <p
      className={`flex items-center gap-1.5 font-bold tabular-nums ${growthTone(value)} ${
        large ? 'text-4xl sm:text-5xl' : 'text-3xl'
      }`}
    >
      {value === 0 ? null : <TrendArrow up={value > 0} className={large ? 'h-7 w-7' : 'h-5 w-5'} />}
      {formatGrowth(value, locale, t)}
    </p>
  );
}

/** The catalog number (ADR-060), kept small next to the name. */
function NumberChip({ number }: { number: string }) {
  return (
    <span className="flex-shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {number}
    </span>
  );
}

function Legend({ year, previousYear }: { year: number; previousYear: number }) {
  const { t } = useTranslation();

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
        {previousYear}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
        {year}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-emerald-500 bg-emerald-500/25" />
        {t('storeDashboard.inProgressShort')}
      </span>
    </p>
  );
}

/** Twelve pairs of bars, last year grey and this year green; for the summary cards. */
function MiniBars({ months }: { months: readonly StoreDashboardMonth[] }) {
  const max = chartMax(months);

  return (
    <span aria-hidden="true" className="flex h-10 items-end gap-[3px]">
      {months.map((month) => (
        <span key={month.month} className="flex h-full min-w-0 flex-1 items-end gap-px">
          <span
            className="block w-1/2 rounded-t-sm bg-slate-300 dark:bg-slate-600"
            style={{ height: barHeight(month.previous, max) }}
          />
          <span
            className={`block w-1/2 rounded-t-sm ${
              month.status === 'inProgress'
                ? 'bg-emerald-300 dark:bg-emerald-700'
                : 'bg-emerald-500 dark:bg-emerald-400'
            }`}
            style={{ height: barHeight(month.current, max) }}
          />
        </span>
      ))}
    </span>
  );
}

/** Growth as a bar from a centre line: right and green for growth, left and red for decline. */
function DivergingBar({ value, maxAbs }: { value: number | null; maxAbs: number }) {
  return (
    <span className="relative mt-1.5 block h-2 rounded-full bg-slate-100 dark:bg-slate-800">
      <span className="absolute inset-y-0 left-1/2 w-px bg-slate-300 dark:bg-slate-600" />
      {value === null || value === 0 ? null : (
        <span
          className={`absolute inset-y-0 rounded-full ${
            value > 0 ? 'left-1/2 bg-emerald-500' : 'right-1/2 bg-red-500'
          }`}
          style={{ width: `${String(Math.min(50, (Math.abs(value) / maxAbs) * 50))}%` }}
        />
      )}
    </span>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </section>
  );
}

/** What the two values of a card stand for: the compared months, or each year on its own. */
function yearLabels(
  comparison: StoreDashboardComparison,
  year: number,
  previousYear: number,
  t: Translate,
): {
  current: string;
  previous: string;
  currentValue: number | null;
  previousValue: number | null;
} {
  const { summary } = comparison;

  return summary.comparableMonths.length > 0
    ? {
        current: String(year),
        previous: String(previousYear),
        currentValue: summary.current,
        previousValue: summary.previous,
      }
    : {
        current: t('storeDashboard.yearSoFar', { year, count: summary.currentYearMonths }),
        previous: t('storeDashboard.previousYearAll', {
          year: previousYear,
          count: summary.previousYearMonths,
        }),
        currentValue: summary.currentYearValue,
        previousValue: summary.previousYearValue,
      };
}

// ---------------------------------------------------------------------------
// Summary tab
// ---------------------------------------------------------------------------

function KpiSummaryCard({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
  onOpen,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
  onOpen: () => void;
}) {
  const { t, locale } = useTranslation();
  const names = kpiNames(kpi, locale, t);
  const labels = yearLabels(comparison, year, previousYear, t);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('storeDashboard.openKpi', { name: names.full })}
      className="flex min-h-[44px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="flex items-center gap-3">
        <KpiBadgeIcon code={kpi.code} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {names.short}
            </span>
            {names.number ? <NumberChip number={names.number} /> : null}
          </span>
          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
            {names.label}
          </span>
        </span>
        <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
      </span>
      <GrowthHeadline value={comparison.summary.growthPercent} />
      <span className="grid grid-cols-2 gap-2 text-xs">
        <span className="min-w-0">
          <span className="block truncate text-slate-500 dark:text-slate-400">
            {labels.current}
          </span>
          <span className="block truncate font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatValue(labels.currentValue, kpi, currency, locale, t)}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-slate-500 dark:text-slate-400">
            {labels.previous}
          </span>
          <span className="block truncate font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            {formatValue(labels.previousValue, kpi, currency, locale, t)}
          </span>
        </span>
      </span>
      <MiniBars months={comparison.months} />
      {kpi.aggregation === 'average' ? (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.monthlyAverage')}
        </span>
      ) : null}
    </button>
  );
}

/** Every store against every KPI: where the growth came from. */
function StoreMatrix({
  data,
  currency,
  onOpen,
}: {
  data: StoreDashboardResponse;
  currency: Currency;
  onOpen: (code: string, storeNr: number) => void;
}) {
  const { t, locale } = useTranslation();
  const kpis = data.kpis.map((kpi) => {
    const names = kpiNames(kpi, locale, t);

    return { kpi, name: names.full, short: names.short };
  });
  const growthOf = (kpi: StoreDashboardKpi, storeNr: number) =>
    comparisonFor(kpi, currency, storeNr)?.summary.growthPercent ?? null;

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.storesTitle')}
      </h2>
      {data.stores.length === 1 ? (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {t('storeDashboard.singleStore')}
        </p>
      ) : null}

      {/* Mobile and tablet: a card per store */}
      <ul className="mt-3 flex flex-col gap-3 lg:hidden">
        {data.stores.map((store) => (
          <li
            key={store.nr}
            className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {storeLabel(store)}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {kpis.map(({ kpi, name, short }) => (
                <button
                  key={kpi.code}
                  type="button"
                  onClick={() => onOpen(kpi.code, store.nr)}
                  aria-label={t('storeDashboard.openKpi', {
                    name: `${storeLabel(store)} · ${name}`,
                  })}
                  className="flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-50 px-2.5 text-left transition hover:bg-emerald-500/10 dark:bg-slate-800/60"
                >
                  <StoreKpiIcon
                    code={kpi.code}
                    className="h-4 w-4 flex-shrink-0 text-emerald-700 dark:text-emerald-300"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                    {short}
                  </span>
                  <GrowthBadge value={growthOf(kpi, store.nr)} compact />
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: one table */}
      <div className="mt-3 hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 pr-3 font-medium">{t('storeDashboard.store')}</th>
              {kpis.map(({ kpi, name, short }) => (
                <th key={kpi.code} className="px-2 py-2 font-medium" title={name}>
                  <span className="flex items-center gap-1.5">
                    <StoreKpiIcon code={kpi.code} className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{short}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.stores.map((store) => (
              <tr key={store.nr} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="max-w-[16rem] truncate py-2 pr-3 font-medium text-slate-800 dark:text-slate-100">
                  {storeLabel(store)}
                </td>
                {kpis.map(({ kpi, name }) => (
                  <td key={kpi.code} className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => onOpen(kpi.code, store.nr)}
                      aria-label={t('storeDashboard.openKpi', {
                        name: `${storeLabel(store)} · ${name}`,
                      })}
                      className="flex min-h-[44px] w-full items-center rounded-lg px-1 transition hover:bg-emerald-500/10"
                    >
                      <GrowthBadge value={growthOf(kpi, store.nr)} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryTab({
  data,
  currency,
  storeNr,
  onOpen,
}: {
  data: StoreDashboardResponse;
  currency: Currency;
  storeNr: number | null;
  onOpen: (code: string, storeNr?: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => {
          const comparison = comparisonFor(kpi, currency, storeNr);

          return comparison ? (
            <KpiSummaryCard
              key={kpi.code}
              kpi={kpi}
              comparison={comparison}
              currency={currency}
              year={data.year}
              previousYear={data.previousYear}
              onOpen={() => onOpen(kpi.code)}
            />
          ) : null;
        })}
      </div>
      {storeNr === null && data.stores.length > 0 ? (
        <StoreMatrix data={data} currency={currency} onOpen={onOpen} />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI tab
// ---------------------------------------------------------------------------

function StatBox({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 sm:text-lg ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}

function KpiHeader({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
}) {
  const { t, locale } = useTranslation();
  const names = kpiNames(kpi, locale, t);
  const { summary } = comparison;
  const labels = yearLabels(comparison, year, previousYear, t);

  return (
    <Card>
      <div className="flex items-center gap-3">
        <KpiBadgeIcon code={kpi.code} />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="truncate">{names.short}</span>
            {names.number ? <NumberChip number={names.number} /> : null}
          </h2>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{names.label}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('storeDashboard.growth')}
      </p>
      <GrowthHeadline value={summary.growthPercent} large />
      {summary.comparableMonths.length > 0 ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('storeDashboard.comparedMonths', {
            range: monthRange(summary.comparableMonths, locale),
            count: summary.comparableMonths.length,
          })}
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatBox
          label={labels.current}
          value={formatValue(labels.currentValue, kpi, currency, locale, t)}
        />
        <StatBox
          label={labels.previous}
          value={formatValue(labels.previousValue, kpi, currency, locale, t)}
          tone="!text-slate-600 dark:!text-slate-300"
        />
        {summary.difference === null ? null : (
          <StatBox
            label={t('storeDashboard.difference')}
            value={formatDifference(summary.difference, kpi, currency, locale, t)}
            tone={growthTone(summary.difference)}
          />
        )}
      </div>
      {kpi.aggregation === 'average' ? (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.monthlyAverage')}
        </p>
      ) : null}
      {kpi.aggregation === 'ratio' ? (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.ratioNote')}
        </p>
      ) : null}
    </Card>
  );
}

interface ChangeLabelProps {
  percent: number;
  /** The change in the KPI's own unit; null when a value is missing. */
  difference: string | null;
  /** "Temmuz 2026: 178 969 TMT": what the month is compared with, then the month itself. */
  from: string;
  to: string;
}

/**
 * A month's change above its bars: the arrow on a phone, with the percentage from `sm:`.
 * Hovering it (or focusing the month) tells how much the change is and between which values.
 */
function ChangeLabel({
  percent,
  difference,
  from,
  to,
  bottom,
  align,
}: ChangeLabelProps & { bottom: number; align: 'left' | 'center' | 'right' }) {
  const { t, locale } = useTranslation();
  const growth = formatGrowth(percent, locale, t);
  const tone = percent > 0 ? 'text-emerald-300' : percent < 0 ? 'text-red-300' : 'text-slate-100';
  // The first and last months open the tooltip inwards, so it stays on the screen.
  const position =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <span
      className="absolute inset-x-0 flex justify-center"
      style={{ bottom: `calc(${String(bottom)}% + 1px)` }}
    >
      <span
        className={`group/change relative inline-flex items-center gap-0.5 whitespace-nowrap p-1 text-[11px] font-semibold leading-none tabular-nums ${growthTone(percent)}`}
      >
        {percent === 0 ? null : <TrendArrow up={percent > 0} className="h-3 w-3" />}
        <span className="hidden sm:inline">
          {t('storeDashboard.percent', {
            value: formatNumber(Math.abs(percent), locale, { maximumFractionDigits: 0 }),
          })}
        </span>
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full z-20 mb-1 hidden w-max max-w-[16rem] rounded-lg bg-slate-900 px-2.5 py-2 text-left text-[11px] font-normal leading-snug text-slate-300 shadow-lg ring-1 ring-white/10 group-hover/change:block group-focus-visible:block dark:bg-slate-800 ${position}`}
        >
          <span className={`block text-xs font-semibold ${tone}`}>
            {difference === null ? growth : `${difference} · ${growth}`}
          </span>
          <span className="mt-1 block">{from}</span>
          <span className="block">{to}</span>
        </span>
      </span>
    </span>
  );
}

/** One change of the selected month: what it is against, the percentage and how much. */
function ChangeLine({
  label,
  percent,
  difference,
}: {
  label: string;
  percent: number | null;
  difference: string | null;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-slate-500 dark:text-slate-400">{`${label}:`}</span>
      <GrowthBadge value={percent} />
      {percent !== null && difference !== null ? (
        <span className={`font-medium tabular-nums ${growthTone(percent)}`}>{difference}</span>
      ) : null}
    </span>
  );
}

/**
 * The months as bars, last year grey and this year green. Above the bars the change against
 * the year before or the month before, as chosen; a month tapped shows both.
 */
function MonthlyChart({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
}) {
  const { t, locale } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [basis, setBasis] = useState<ChangeBasis>('year');
  const months = comparison.months;
  const max = chartMax(months);
  const selectedMonth = months.find((month) => month.month === selected) ?? null;
  const value = (amount: number | null) => formatValue(amount, kpi, currency, locale, t);
  const difference = (amount: number | null) =>
    amount === null ? null : formatDifference(amount, kpi, currency, locale, t);
  const label = (month: number, ofYear: number) => `${monthName(month, locale)} ${String(ofYear)}`;
  // Without last year (2026 today) there is nothing to compare: the month before is shown.
  const hasYearGrowth = months.some((month) => month.growthPercent !== null);
  const shownBasis: ChangeBasis = hasYearGrowth ? basis : 'month';

  /** The change written above a month's bars, with the two values it compares. */
  function changeOf(month: StoreDashboardMonth): ChangeLabelProps | null {
    if (shownBasis === 'year') {
      return month.growthPercent === null
        ? null
        : {
            percent: month.growthPercent,
            difference: difference(yearDifference(month)),
            from: `${label(month.month, previousYear)}: ${value(month.previous)}`,
            to: `${label(month.month, year)}: ${value(month.current)}`,
          };
    }

    const before = month.month === 1 ? label(12, year - 1) : label(month.month - 1, year);

    return month.previousMonthGrowthPercent === null
      ? null
      : {
          percent: month.previousMonthGrowthPercent,
          difference: difference(monthDifference(month)),
          from: `${before}: ${value(month.previousMonth)}`,
          to: `${label(month.month, year)}: ${value(month.current)}`,
        };
  }

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t('storeDashboard.monthlyTitle')}
        </h3>
        <Legend year={year} previousYear={previousYear} />
      </div>
      <div
        role="group"
        aria-label={t('storeDashboard.changeBasis')}
        className="mt-2 flex h-11 w-full rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 sm:inline-flex sm:w-auto"
      >
        {CHANGE_BASES.map((option) => {
          const unavailable = option === 'year' && !hasYearGrowth;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={shownBasis === option}
              disabled={unavailable}
              title={unavailable ? t('storeDashboard.noGrowth') : undefined}
              onClick={() => setBasis(option)}
              className={`flex-1 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${
                shownBasis === option
                  ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                  : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'
              }`}
            >
              {option === 'year'
                ? t('storeDashboard.vsPreviousYear')
                : t('storeDashboard.vsPreviousMonth')}
            </button>
          );
        })}
      </div>
      <div
        aria-live="polite"
        className="mt-2 flex min-h-[24px] flex-col gap-1 text-xs text-slate-600 dark:text-slate-300"
      >
        {selectedMonth ? (
          <>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{monthName(selectedMonth.month, locale)}</span>
              <span className="tabular-nums">{`${String(year)}: ${value(selectedMonth.current)}`}</span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">
                {`${String(previousYear)}: ${value(selectedMonth.previous)}`}
              </span>
              {selectedMonth.status === 'inProgress' ? (
                <span className="text-slate-500">{t('storeDashboard.inProgressShort')}</span>
              ) : null}
            </p>
            {selectedMonth.status === 'complete' ? (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <ChangeLine
                  label={t('storeDashboard.vsPreviousYear')}
                  percent={selectedMonth.growthPercent}
                  difference={difference(yearDifference(selectedMonth))}
                />
                <ChangeLine
                  label={t('storeDashboard.vsPreviousMonth')}
                  percent={selectedMonth.previousMonthGrowthPercent}
                  difference={difference(monthDifference(selectedMonth))}
                />
              </p>
            ) : null}
          </>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">
            {t('storeDashboard.monthlyHint')}
          </span>
        )}
      </div>

      {/* The top padding leaves room for the change above the tallest bar. */}
      <div className="mt-2 pt-5">
        <div className="relative flex h-40 items-end gap-1 border-b border-slate-200 dark:border-slate-700 sm:h-52 sm:gap-2">
          <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200 dark:border-slate-800" />
          <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-800" />
          {months.map((month) => {
            const isSelected = month.month === selected;
            const change = changeOf(month);

            return (
              <button
                key={month.month}
                type="button"
                onClick={() => setSelected(isSelected ? null : month.month)}
                aria-pressed={isSelected}
                aria-label={t('storeDashboard.monthAria', {
                  month: monthName(month.month, locale),
                  year,
                  current: value(month.current),
                  previousYear,
                  previous: value(month.previous),
                })}
                className={`group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px rounded-t-md transition ${
                  isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-500/5'
                }`}
              >
                {change ? (
                  <ChangeLabel
                    {...change}
                    bottom={Math.max(
                      barPercent(month.previous, max),
                      barPercent(month.current, max),
                    )}
                    align={month.month <= 3 ? 'left' : month.month >= 10 ? 'right' : 'center'}
                  />
                ) : null}
                <span
                  className="block w-[45%] rounded-t-sm bg-slate-300 dark:bg-slate-600"
                  style={{ height: barHeight(month.previous, max) }}
                />
                <span
                  className={`block w-[45%] rounded-t-sm ${
                    month.status === 'inProgress'
                      ? 'border border-dashed border-emerald-500 bg-emerald-500/25'
                      : 'bg-emerald-500 group-hover:bg-emerald-600 dark:bg-emerald-400'
                  }`}
                  style={{ height: barHeight(month.current, max) }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex gap-1 sm:gap-2">
        {months.map((month) => (
          <span
            key={month.month}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-slate-500 dark:text-slate-400"
          >
            {monthName(month.month, locale, 'short')}
          </span>
        ))}
      </div>
    </Card>
  );
}

/** The months as a sortable list: column headers on desktop, a header row of the same on a phone. */
function MonthlyTable({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
  sort,
  onSort,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
  sort: MonthSort;
  onSort: (key: MonthSortKey) => void;
}) {
  const { t, locale } = useTranslation();
  // A month with no value in either year has nothing to show; the running one always shows.
  const months = sortMonths(
    comparison.months.filter(
      (month) => month.status === 'inProgress' || month.current !== null || month.previous !== null,
    ),
    sort,
  );
  const value = (amount: number | null) => formatValue(amount, kpi, currency, locale, t);
  const sortProps = { sort, onSort };
  const inProgressChip = (
    <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
      {t('storeDashboard.inProgressShort')}
    </span>
  );

  return (
    <Card className="!p-0">
      {/* Mobile and tablet: a row per month, sorted by the row of column names above it */}
      <div
        role="group"
        aria-label={t('storeDashboard.sort')}
        className="flex items-center gap-3 border-b border-slate-200 px-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 lg:hidden"
      >
        <SortButton label={t('storeDashboard.month')} sortKey="month" {...sortProps} />
        <span className="ml-auto" />
        <SortButton label={String(year)} sortKey="current" align="right" {...sortProps} />
        <SortButton label={String(previousYear)} sortKey="previous" align="right" {...sortProps} />
        <SortButton
          label={t('storeDashboard.change')}
          sortKey="growth"
          align="right"
          {...sortProps}
        />
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
        {months.map((month) => (
          <li
            key={month.month}
            className={`flex items-center gap-3 px-4 py-2.5 ${
              month.status === 'upcoming' ? 'opacity-60' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {monthName(month.month, locale)}
                {month.status === 'inProgress' ? inProgressChip : null}
              </p>
              <p className="truncate text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {`${String(year)}: ${value(month.current)} · ${String(previousYear)}: ${value(month.previous)}`}
              </p>
            </div>
            <GrowthBadge value={month.growthPercent} compact />
          </li>
        ))}
      </ul>

      {/* Desktop: a table */}
      <table className="hidden w-full text-sm lg:table">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <SortableHeader label={t('storeDashboard.month')} sortKey="month" {...sortProps} />
            <SortableHeader
              label={String(previousYear)}
              sortKey="previous"
              align="right"
              {...sortProps}
            />
            <SortableHeader label={String(year)} sortKey="current" align="right" {...sortProps} />
            <SortableHeader
              label={t('storeDashboard.difference')}
              sortKey="difference"
              align="right"
              {...sortProps}
            />
            <SortableHeader
              label={t('storeDashboard.change')}
              sortKey="growth"
              align="right"
              {...sortProps}
            />
          </tr>
        </thead>
        <tbody>
          {months.map((month) => {
            const change = yearDifference(month);

            return (
              <tr
                key={month.month}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800/60 ${
                  month.status === 'upcoming' ? 'opacity-60' : ''
                }`}
              >
                <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                  {monthName(month.month, locale)}
                  {month.status === 'inProgress' ? inProgressChip : null}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {value(month.previous)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {value(month.current)}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-2 text-right tabular-nums ${growthTone(change)}`}
                >
                  {change === null ? '—' : formatDifference(change, kpi, currency, locale, t)}
                </td>
                <td className="px-4 py-2 text-right">
                  <GrowthBadge value={month.growthPercent} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/** The stores of one KPI ranked by growth, each with a bar from the centre line. */
function StoreRanking({
  data,
  kpi,
  currency,
  onSelect,
}: {
  data: StoreDashboardResponse;
  kpi: StoreDashboardKpi;
  currency: Currency;
  onSelect: (storeNr: number) => void;
}) {
  const { t, locale } = useTranslation();
  const entries = data.stores
    .map((store) => ({ store, comparison: comparisonFor(kpi, currency, store.nr) }))
    .flatMap(({ store, comparison }) => (comparison ? [{ store, comparison }] : []))
    .sort((left, right) => {
      const a = left.comparison.summary.growthPercent;
      const b = right.comparison.summary.growthPercent;

      if (a === null || b === null) {
        return a === b ? 0 : a === null ? 1 : -1;
      }

      return b - a;
    });
  const maxAbs = Math.max(
    1,
    ...entries.map((entry) => Math.abs(entry.comparison.summary.growthPercent ?? 0)),
  );

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.storesTitle')}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {data.stores.length === 1
          ? t('storeDashboard.singleStore')
          : t('storeDashboard.storesHint')}
      </p>
      <ul className="mt-2 flex flex-col">
        {entries.map(({ store, comparison }) => {
          // The years alone: the header already says which months the values cover.
          const { currentValue, previousValue } = yearLabels(
            comparison,
            data.year,
            data.previousYear,
            t,
          );

          return (
            <li key={store.nr}>
              <button
                type="button"
                onClick={() => onSelect(store.nr)}
                className="block min-h-[44px] w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-500/5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {storeLabel(store)}
                  </span>
                  <GrowthBadge value={comparison.summary.growthPercent} />
                </span>
                <DivergingBar value={comparison.summary.growthPercent} maxAbs={maxAbs} />
                <span className="mt-1 block truncate text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {`${String(data.year)}: ${formatValue(currentValue, kpi, currency, locale, t)} · ${String(data.previousYear)}: ${formatValue(previousValue, kpi, currency, locale, t)}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function KpiTab({
  data,
  kpi,
  currency,
  storeNr,
  onSelectStore,
  monthSort,
  onMonthSort,
}: {
  data: StoreDashboardResponse;
  kpi: StoreDashboardKpi;
  currency: Currency;
  storeNr: number | null;
  onSelectStore: (storeNr: number) => void;
  monthSort: MonthSort;
  onMonthSort: (key: MonthSortKey) => void;
}) {
  const { t } = useTranslation();
  const comparison = comparisonFor(kpi, currency, storeNr);

  if (!comparison) {
    return null;
  }

  const props = { kpi, comparison, currency, year: data.year, previousYear: data.previousYear };

  return (
    <div className="flex flex-col gap-4">
      <KpiHeader {...props} />
      {/* The numbers come first; the chart below draws the same months. */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div
          className={storeNr === null && data.stores.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'}
        >
          <MonthlyTable {...props} sort={monthSort} onSort={onMonthSort} />
        </div>
        {storeNr === null && data.stores.length > 0 ? (
          <div className="lg:col-span-2">
            <StoreRanking data={data} kpi={kpi} currency={currency} onSelect={onSelectStore} />
          </div>
        ) : null}
      </div>
      {/* Keyed by the store and currency, so the selected month resets with them. */}
      <MonthlyChart key={`${String(storeNr)}-${currency}`} {...props} />
      {storeNr === null && data.stores.length > 1 && kpi.aggregation === 'average' ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.customersNote')}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/** A tab: the KPI's icon and short name, so nobody has to remember what "#4" was. */
function TabButton({
  active,
  onClick,
  label,
  code,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  /** The KPI's code; null for the summary tab. */
  code: string | null;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={PANEL_ID}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex min-h-[44px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border pl-3 pr-4 text-sm font-medium transition ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950'
          : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      <StoreKpiIcon
        code={code}
        className={`h-4 w-4 flex-shrink-0 ${active ? '' : 'text-emerald-600 dark:text-emerald-400'}`}
      />
      {children}
    </button>
  );
}

function FreshnessLine({ refresh }: { refresh: StoreDashboardResponse['refresh'] }) {
  const { t, locale } = useTranslation();

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span
        aria-hidden="true"
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          refresh.intervalMinutes > 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
        }`}
      />
      <span>
        {refresh.intervalMinutes > 0
          ? t('storeDashboard.refreshEvery', {
              minutes: formatNumber(refresh.intervalMinutes, locale),
            })
          : t('storeDashboard.refreshOff')}
      </span>
      {refresh.lastRunAt ? (
        <span>
          · {t('storeDashboard.updatedAt', { at: formatDateTime(refresh.lastRunAt, locale) })}
        </span>
      ) : null}
    </p>
  );
}

/** The summary line under the filters: which years, which months, what is left out. */
function ComparisonNotes({
  data,
  currency,
  storeNr,
}: {
  data: StoreDashboardResponse;
  currency: Currency;
  storeNr: number | null;
}) {
  const { t, locale } = useTranslation();
  const first = data.kpis[0];
  const comparable = first
    ? (comparisonFor(first, currency, storeNr)?.summary.comparableMonths ?? [])
    : [];
  const [currentYear, currentMonth] = data.currentMonth.split('-').map(Number);
  const running = currentYear === data.year && currentMonth !== undefined ? currentMonth : null;

  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white dark:from-emerald-500/25 dark:to-emerald-500/5 dark:text-emerald-50">
      <h2 className="text-lg font-bold">
        {t('storeDashboard.comparing', { year: data.year, previous: data.previousYear })}
      </h2>
      <p className="mt-1 text-sm text-emerald-50/90">
        {comparable.length > 0
          ? t('storeDashboard.comparedMonths', {
              range: monthRange(comparable, locale),
              count: comparable.length,
            })
          : t('storeDashboard.noComparison', { year: data.year, previous: data.previousYear })}
      </p>
      {running !== null ? (
        <p className="mt-1 text-xs text-emerald-50/80">
          {t('storeDashboard.inProgress', { month: monthName(running, locale) })}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Store dashboard (ADR-061, ADR-065), full access only: the store KPIs #1–#7 and #16 of a
 * calendar year against the year before, month by month. The summary tab shows how much each
 * KPI grew and where (store by store); each KPI tab has the month list with the store
 * ranking first, then the monthly chart. Growth is measured over finished months that have values in both years. Year,
 * store, currency and tab live in the URL (`?year=&store=&currency=&tab=`).
 */
export function StoreDashboardPage() {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = Number(searchParams.get('year'));
  const year = Number.isInteger(yearParam) && yearParam >= 2000 ? yearParam : undefined;
  const storeParam = searchParams.get('store');
  const requestedStore =
    storeParam !== null && /^\d+$/.test(storeParam) ? Number(storeParam) : null;
  const currency: Currency = searchParams.get('currency') === 'USD' ? 'USD' : 'TMT';
  const tabParam = searchParams.get('tab');
  // Kept here, so the month list stays in the chosen order from one KPI tab to the next.
  const [monthSort, setMonthSort] = useState<MonthSort>(DEFAULT_MONTH_SORT);

  const query = useQuery({
    queryKey: ['store-dashboard', year ?? null],
    queryFn: () => getStoreDashboard(year),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const storeNr =
    requestedStore !== null && data?.stores.some((store) => store.nr === requestedStore)
      ? requestedStore
      : null;
  const activeKpi = data?.kpis.find((kpi) => kpi.code === tabParam) ?? null;
  const showCurrency = activeKpi === null || activeKpi.unit === 'money';

  function update(next: {
    year?: number | undefined;
    store?: number | null;
    currency?: Currency;
    tab?: string | null;
  }) {
    const params: Record<string, string> = {};
    const nextYear = 'year' in next ? next.year : year;
    const nextStore = 'store' in next ? next.store : storeNr;
    const nextCurrency = next.currency ?? currency;
    const nextTab = 'tab' in next ? next.tab : (activeKpi?.code ?? null);

    if (nextYear !== undefined) {
      params.year = String(nextYear);
    }

    if (nextStore !== null && nextStore !== undefined) {
      params.store = String(nextStore);
    }

    if (nextCurrency !== 'TMT') {
      params.currency = nextCurrency;
    }

    if (nextTab) {
      params.tab = nextTab;
    }

    setSearchParams(params, { replace: true });
  }

  function openKpi(code: string, store?: number) {
    update(store === undefined ? { tab: code } : { tab: code, store });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AppShell title={t('storeDashboard.title')} fullWidth>
      <div className="mx-auto w-full max-w-6xl px-4">
        {data ? (
          <div className="mb-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <FilterSelect
                id="store-dashboard-year"
                label={t('storeDashboard.year')}
                icon={<CalendarIcon className="h-4 w-4" />}
                value={String(data.year)}
                onChange={(value) => update({ year: Number(value) })}
              >
                {data.years.map((option) => (
                  <option key={option} value={option}>
                    {t('storeDashboard.yearOption', { year: option, previous: option - 1 })}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                id="store-dashboard-store"
                label={t('storeDashboard.store')}
                icon={<StoreIcon className="h-4 w-4" />}
                value={storeNr === null ? '' : String(storeNr)}
                onChange={(value) => update({ store: value === '' ? null : Number(value) })}
              >
                <option value="">{t('storeDashboard.allStores')}</option>
                {data.stores.map((store) => (
                  <option key={store.nr} value={store.nr}>
                    {storeLabel(store)}
                  </option>
                ))}
              </FilterSelect>
              {showCurrency ? (
                <div
                  role="group"
                  aria-label={t('storeDashboard.currency')}
                  className="col-span-2 flex h-11 w-full rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 sm:w-auto"
                >
                  {CURRENCIES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={currency === option}
                      onClick={() => update({ currency: option })}
                      className={`flex-1 rounded-full px-4 text-sm font-semibold transition sm:flex-none ${
                        currency === option
                          ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                          : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <FreshnessLine refresh={data.refresh} />
          </div>
        ) : null}

        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('storeDashboard.loading')}
          </p>
        ) : null}

        {query.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {t('storeDashboard.error')}
          </p>
        ) : null}

        {data && data.stores.length === 0 && !query.isPlaceholderData ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('storeDashboard.empty')}
          </p>
        ) : null}

        {data && data.stores.length > 0 ? (
          <div
            aria-busy={query.isPlaceholderData}
            className={`flex flex-col gap-4 transition-opacity ${
              query.isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            <div
              role="tablist"
              aria-label={t('storeDashboard.tabs')}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <TabButton
                active={activeKpi === null}
                onClick={() => update({ tab: null })}
                label={t('storeDashboard.summaryTab')}
                code={null}
              >
                {t('storeDashboard.summaryTab')}
              </TabButton>
              {data.kpis.map((kpi) => {
                const names = kpiNames(kpi, locale, t);
                const growth = comparisonFor(kpi, currency, storeNr)?.summary.growthPercent ?? null;

                return (
                  <TabButton
                    key={kpi.code}
                    active={activeKpi?.code === kpi.code}
                    onClick={() => update({ tab: kpi.code })}
                    label={names.full}
                    code={kpi.code}
                  >
                    <span className="font-semibold">{names.short}</span>
                    <GrowthBadge value={growth} compact />
                  </TabButton>
                );
              })}
            </div>

            <div id={PANEL_ID} role="tabpanel" className="flex flex-col gap-4">
              <ComparisonNotes data={data} currency={currency} storeNr={storeNr} />
              {activeKpi ? (
                <KpiTab
                  key={activeKpi.code}
                  data={data}
                  kpi={activeKpi}
                  currency={currency}
                  storeNr={storeNr}
                  onSelectStore={(nr) => update({ store: nr })}
                  monthSort={monthSort}
                  onMonthSort={(key) => setMonthSort((current) => nextMonthSort(current, key))}
                />
              ) : (
                <SummaryTab data={data} currency={currency} storeNr={storeNr} onOpen={openKpi} />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
