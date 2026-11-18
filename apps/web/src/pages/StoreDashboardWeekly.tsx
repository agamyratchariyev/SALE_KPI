import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getStoreDashboardWeekly } from '../api/store-dashboard';
import { CalendarIcon, FilterSelect, StoreIcon } from '../components/FilterSelect';
import {
  Card,
  ChevronRightIcon,
  CurrencySwitch,
  FreshnessLine,
  GrowthBadge,
  InProgressChip,
  KpiBadgeIcon,
  NumberChip,
  TrendArrow,
  barHeight,
  barPercent,
  formatGrowth,
  formatValue,
  growthTone,
  kpiNames,
  storeLabel,
  valueDigits,
  type Currency,
} from '../components/StoreDashboardParts';
import { formatDateRange, formatNumber, formatShortDate } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import type {
  StoreDashboardWeek,
  StoreDashboardWeekComparison,
  StoreDashboardWeekKpi,
  StoreDashboardWeeklyResponse,
} from '../types/api';

type ChangeBasis = 'week' | 'fourWeeks';

const WEEK_COUNTS = [8, 13, 26];
const DEFAULT_WEEK_COUNT = 13;
const CHANGE_BASES: ChangeBasis[] = ['week', 'fourWeeks'];

/** The weeks of one store (or all, `storeNr` null) in the chosen currency. */
function comparisonFor(
  kpi: StoreDashboardWeekKpi,
  currency: Currency,
  storeNr: number | null,
): StoreDashboardWeekComparison | null {
  const series =
    kpi.series.find((entry) => entry.currency === null || entry.currency === currency) ??
    kpi.series[0];

  if (!series) {
    return null;
  }

  return storeNr === null
    ? series.total
    : (series.stores.find((entry) => entry.storeNr === storeNr) ?? null);
}

function weekOf(
  comparison: StoreDashboardWeekComparison | null,
  weekStart: string,
): StoreDashboardWeek | null {
  return comparison?.weeks.find((week) => week.weekStart === weekStart) ?? null;
}

function changeOf(week: StoreDashboardWeek, basis: ChangeBasis): number | null {
  return basis === 'week' ? week.previousWeekGrowthPercent : week.fourWeekGrowthPercent;
}

/** A change badge that stays narrow: past 100% the decimal says nothing. */
function ChangeBadge({ value }: { value: number | null }) {
  return <GrowthBadge value={value} compact digits={Math.abs(value ?? 0) >= 100 ? 0 : 1} />;
}

/**
 * What a change is against, then the change; a dash when there is nothing to compare. Without
 * the badge's padding both fit a card half a phone wide.
 */
function ChangeRow({ label, value }: { label: string; value: number | null }) {
  const { t, locale } = useTranslation();

  return (
    <span className="flex min-h-[20px] items-center justify-between gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="min-w-0 truncate">{label}</span>
      {value === null ? (
        <span aria-hidden="true">—</span>
      ) : (
        <span
          className={`inline-flex flex-shrink-0 items-center gap-0.5 font-semibold tabular-nums ${growthTone(value)}`}
        >
          {value === 0 ? null : <TrendArrow up={value > 0} className="h-2.5 w-2.5" />}
          {formatGrowth(value, locale, t, Math.abs(value) >= 100 ? 0 : 1)}
        </span>
      )}
    </span>
  );
}

/** The chosen week with arrows to the weeks around it. */
function WeekNavigator({
  week,
  lastCompleteWeek,
  previous,
  next,
  onSelect,
}: {
  week: StoreDashboardWeek;
  lastCompleteWeek: string;
  previous: string | null;
  next: string | null;
  onSelect: (weekStart: string) => void;
}) {
  const { t, locale } = useTranslation();
  const inProgress = week.status === 'inProgress';
  const label = inProgress
    ? t('storeDashboard.runningWeek')
    : week.weekStart === lastCompleteWeek
      ? t('storeDashboard.lastCompleteWeek')
      : t('storeDashboard.selectedWeek');
  const arrowClass =
    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-3 text-white dark:from-emerald-500/25 dark:to-emerald-500/5 dark:text-emerald-50 sm:p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t('storeDashboard.previousWeekAction')}
          disabled={previous === null}
          onClick={() => previous !== null && onSelect(previous)}
          className={arrowClass}
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <div aria-live="polite" className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs text-emerald-50/90">{label}</p>
          <h2 className="text-base font-bold tabular-nums sm:text-lg">
            {formatDateRange(week.weekStart, week.weekEnd, locale, true)}
          </h2>
        </div>
        <button
          type="button"
          aria-label={t('storeDashboard.nextWeekAction')}
          disabled={next === null}
          onClick={() => next !== null && onSelect(next)}
          className={arrowClass}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-emerald-50/90">
        {inProgress ? t('storeDashboard.weekInProgressNote') : t('storeDashboard.weekCompareNote')}
      </p>
    </section>
  );
}

/** One KPI in the chosen week; tapping it opens the KPI's weeks and stores below. */
function WeekKpiCard({
  kpi,
  week,
  currency,
  active,
  onSelect,
}: {
  kpi: StoreDashboardWeekKpi;
  week: StoreDashboardWeek | null;
  currency: Currency;
  active: boolean;
  onSelect: () => void;
}) {
  const { t, locale } = useTranslation();
  const names = kpiNames(kpi, locale, t);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={names.full}
      onClick={onSelect}
      className={`flex min-w-0 flex-col gap-1.5 rounded-2xl border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 dark:bg-slate-900 ${
        active
          ? 'border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-400 dark:ring-emerald-400'
          : 'border-slate-200 hover:border-emerald-400 dark:border-slate-800'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <KpiBadgeIcon code={kpi.code} size="sm" />
        <span className="min-w-0 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {names.short}
        </span>
      </span>
      <span className="truncate text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
        {formatValue(week?.value ?? null, kpi, currency, locale, t)}
      </span>
      <span className="flex flex-col">
        <ChangeRow
          label={t('storeDashboard.previousWeekShort')}
          value={week?.previousWeekGrowthPercent ?? null}
        />
        <ChangeRow
          label={t('storeDashboard.fourWeeksShort')}
          value={week?.fourWeekGrowthPercent ?? null}
        />
      </span>
    </button>
  );
}

/** The weeks, newest first: rows on the header's columns on a phone, a table on desktop. */
function WeekList({
  kpi,
  weeks,
  currency,
  selected,
  onSelect,
}: {
  kpi: StoreDashboardWeekKpi;
  weeks: readonly StoreDashboardWeek[];
  currency: Currency;
  selected: string;
  onSelect: (weekStart: string) => void;
}) {
  const { t, locale } = useTranslation();
  const [basis, setBasis] = useState<ChangeBasis>('week');
  const rows = [...weeks].reverse();
  const value = (amount: number | null) => formatValue(amount, kpi, currency, locale, t);
  // On a phone the currency stands once, in the column name, so the numbers stay short.
  const listValue = (amount: number | null) =>
    amount !== null && kpi.unit === 'money'
      ? formatNumber(amount, locale, { maximumFractionDigits: valueDigits(kpi) })
      : value(amount);
  const range = (week: StoreDashboardWeek) => formatDateRange(week.weekStart, week.weekEnd, locale);
  const columns = 'grid-cols-[minmax(0,1fr)_5rem_4.75rem]';

  return (
    <Card className="!p-0">
      <h3 className="px-4 pt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.weeklyListTitle')}
      </h3>

      {/* Mobile and tablet: the change column shows one comparison at a time */}
      <div className="lg:hidden">
        <div
          role="group"
          aria-label={t('storeDashboard.weekBasis')}
          className="mx-4 mt-2 flex h-11 rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
        >
          {CHANGE_BASES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={basis === option}
              onClick={() => setBasis(option)}
              className={`min-w-0 flex-1 truncate rounded-full px-2 text-xs font-semibold transition ${
                basis === option
                  ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                  : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'
              }`}
            >
              {option === 'week'
                ? t('storeDashboard.previousWeekShort')
                : t('storeDashboard.fourWeeksShort')}
            </button>
          ))}
        </div>
        <div
          className={`mt-2 grid items-center gap-x-2 border-b border-slate-200 px-4 pb-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 ${columns}`}
        >
          <span>{t('storeDashboard.week')}</span>
          <span className="text-right">
            {kpi.unit === 'money' ? currency : t('storeDashboard.value')}
          </span>
          <span className="text-right">{t('storeDashboard.change')}</span>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((week) => (
            <li key={week.weekStart}>
              <button
                type="button"
                aria-current={week.weekStart === selected ? 'true' : undefined}
                onClick={() => onSelect(week.weekStart)}
                className={`grid min-h-[44px] w-full items-center gap-x-2 px-4 py-2 text-left text-sm tabular-nums transition last:rounded-b-2xl ${columns} ${
                  week.weekStart === selected ? 'bg-emerald-500/10' : 'hover:bg-slate-500/5'
                }`}
              >
                <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-100">
                  {range(week)}
                </span>
                <span className="whitespace-nowrap text-right font-semibold text-slate-900 dark:text-slate-100">
                  {listValue(week.value)}
                </span>
                <span className="justify-self-end">
                  {week.status === 'inProgress' ? (
                    <InProgressChip />
                  ) : (
                    <ChangeBadge value={changeOf(week, basis)} />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop: a table with both comparisons */}
      <table className="mt-2 hidden w-full text-sm lg:table">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-4 py-2 font-medium">{t('storeDashboard.week')}</th>
            <th className="px-4 py-2 text-right font-medium">{t('storeDashboard.value')}</th>
            <th className="px-4 py-2 text-right font-medium">
              {t('storeDashboard.previousWeekShort')}
            </th>
            <th className="px-4 py-2 text-right font-medium">
              {t('storeDashboard.fourWeeksShort')}
            </th>
            <th className="px-4 py-2 text-right font-medium">{t('storeDashboard.change')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((week) => (
            <tr
              key={week.weekStart}
              onClick={() => onSelect(week.weekStart)}
              className={`cursor-pointer border-b border-slate-100 transition last:border-0 dark:border-slate-800/60 ${
                week.weekStart === selected ? 'bg-emerald-500/10' : 'hover:bg-slate-500/5'
              }`}
            >
              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                <button
                  type="button"
                  aria-current={week.weekStart === selected ? 'true' : undefined}
                  className="whitespace-nowrap text-left tabular-nums"
                >
                  {range(week)}
                </button>
                {week.status === 'inProgress' ? <InProgressChip className="ml-1.5" /> : null}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {value(week.value)}
              </td>
              <td className="px-4 py-2 text-right">
                <ChangeBadge value={week.previousWeekGrowthPercent} />
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {value(week.fourWeekAverage)}
              </td>
              <td className="px-4 py-2 text-right">
                <ChangeBadge value={week.fourWeekGrowthPercent} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** Every store in the chosen week, largest first, with both comparisons. */
function WeekStores({
  data,
  kpi,
  currency,
  selected,
  onSelect,
}: {
  data: StoreDashboardWeeklyResponse;
  kpi: StoreDashboardWeekKpi;
  currency: Currency;
  selected: string;
  onSelect: (storeNr: number) => void;
}) {
  const { t, locale } = useTranslation();
  const entries = data.stores
    .map((store) => ({ store, week: weekOf(comparisonFor(kpi, currency, store.nr), selected) }))
    .sort((left, right) => (right.week?.value ?? -Infinity) - (left.week?.value ?? -Infinity));
  const max = Math.max(1, ...entries.map((entry) => entry.week?.value ?? 0));

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.storesTitle')}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {t('storeDashboard.weekStoresHint')}
      </p>
      <ul className="mt-2 flex flex-col">
        {entries.map(({ store, week }) => (
          <li key={store.nr}>
            <button
              type="button"
              onClick={() => onSelect(store.nr)}
              className="block min-h-[44px] w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-500/5"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {storeLabel(store)}
                </span>
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatValue(week?.value ?? null, kpi, currency, locale, t)}
                </span>
              </span>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <span
                  className="block h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{ width: `${String(barPercent(week?.value ?? null, max))}%` }}
                />
              </span>
              <span className="mt-1 grid grid-cols-2 gap-x-4">
                <ChangeRow
                  label={t('storeDashboard.previousWeekShort')}
                  value={week?.previousWeekGrowthPercent ?? null}
                />
                <ChangeRow
                  label={t('storeDashboard.fourWeeksShort')}
                  value={week?.fourWeekGrowthPercent ?? null}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The weeks as bars; the chosen one stands out, with its four-week average as a line. */
function WeekChart({
  kpi,
  weeks,
  currency,
  selected,
  onSelect,
}: {
  kpi: StoreDashboardWeekKpi;
  weeks: readonly StoreDashboardWeek[];
  currency: Currency;
  selected: string;
  onSelect: (weekStart: string) => void;
}) {
  const { t, locale } = useTranslation();
  const value = (amount: number | null) => formatValue(amount, kpi, currency, locale, t);
  const selectedWeek = weeks.find((week) => week.weekStart === selected) ?? null;
  const average = selectedWeek?.fourWeekAverage ?? null;
  const max = Math.max(1, average ?? 0, ...weeks.map((week) => week.value ?? 0));
  const labelEvery = weeks.length <= 8 ? 1 : weeks.length <= 13 ? 3 : 5;

  return (
    <Card className="!p-3 sm:!p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.weeklyChartTitle')}
      </h3>
      <p className="mt-0.5 flex min-h-[18px] items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        {average === null ? (
          t('storeDashboard.weeklyChartHint')
        ) : (
          <>
            <span
              aria-hidden="true"
              className="w-4 flex-shrink-0 border-t-2 border-dashed border-slate-500 dark:border-slate-400"
            />
            {t('storeDashboard.fourWeekLine', { value: value(average) })}
          </>
        )}
      </p>
      <div className="relative mt-3 flex h-40 items-end gap-0.5 border-b border-slate-200 dark:border-slate-700 sm:h-52">
        {average === null ? null : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-slate-500 dark:border-slate-400"
            style={{ bottom: barHeight(average, max) }}
          />
        )}
        {weeks.map((week, index) => {
          const isSelected = week.weekStart === selected;
          const range = formatDateRange(week.weekStart, week.weekEnd, locale);
          const tooltipPosition =
            index < 3
              ? 'left-0'
              : index >= weeks.length - 3
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2';

          return (
            <button
              key={week.weekStart}
              type="button"
              aria-pressed={isSelected}
              aria-label={t('storeDashboard.weekAria', { week: range, value: value(week.value) })}
              onClick={() => onSelect(week.weekStart)}
              className={`group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-t transition ${
                isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-500/5'
              }`}
            >
              <span
                className={`block w-full max-w-8 rounded-t ${
                  week.status === 'inProgress'
                    ? 'border border-dashed border-emerald-500 bg-emerald-500/25'
                    : isSelected
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : 'bg-emerald-300 group-hover:bg-emerald-400 dark:bg-emerald-800 dark:group-hover:bg-emerald-700'
                }`}
                style={{ height: barHeight(week.value, max) }}
              />
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-20 mb-1 hidden w-max rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-[11px] leading-snug text-slate-300 shadow-lg ring-1 ring-white/10 group-hover:block group-focus-visible:block dark:bg-slate-800 ${tooltipPosition}`}
              >
                <span className="block">{range}</span>
                <span className="block font-semibold tabular-nums text-slate-100">
                  {value(week.value)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex h-4 gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        {weeks.map((week, index) => {
          const fromEnd = weeks.length - 1 - index;
          const position =
            fromEnd === 0 ? 'right-0' : index === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2';

          return (
            <span key={week.weekStart} className="relative min-w-0 flex-1">
              {fromEnd % labelEvery === 0 ? (
                <span className={`absolute top-0 whitespace-nowrap ${position}`}>
                  {formatShortDate(week.weekStart, locale)}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * The store KPIs week by week (ADR-071): the chosen week of every KPI against the week before
 * and the average of the four before that, then the chosen KPI's weeks, its stores and a chart.
 * Weeks are analysis only. The URL holds the choices (`?view=weekly&weeks=&week=&store=&currency=&tab=`).
 */
export function StoreDashboardWeekly() {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const weeksParam = Number(searchParams.get('weeks'));
  const weekCount = WEEK_COUNTS.includes(weeksParam) ? weeksParam : DEFAULT_WEEK_COUNT;
  const storeParam = searchParams.get('store');
  const requestedStore =
    storeParam !== null && /^\d+$/.test(storeParam) ? Number(storeParam) : null;
  const currency: Currency = searchParams.get('currency') === 'USD' ? 'USD' : 'TMT';
  const query = useQuery({
    queryKey: ['store-dashboard', 'weekly', weekCount],
    queryFn: () => getStoreDashboardWeekly(weekCount),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const storeNr =
    requestedStore !== null && data?.stores.some((store) => store.nr === requestedStore)
      ? requestedStore
      : null;
  const kpi = data?.kpis.find((entry) => entry.code === searchParams.get('tab')) ?? data?.kpis[0];
  const weeks = (kpi ? comparisonFor(kpi, currency, storeNr)?.weeks : undefined) ?? [];
  const selectedIndex = (() => {
    const requested = weeks.findIndex((week) => week.weekStart === searchParams.get('week'));

    return requested >= 0
      ? requested
      : weeks.findIndex((week) => week.weekStart === data?.lastCompleteWeek);
  })();
  const selectedWeek = weeks[selectedIndex] ?? weeks.at(-1) ?? null;

  /** Changes the given choices in the URL and keeps the others. */
  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);

    params.set('view', 'weekly');

    for (const [key, value] of Object.entries(next)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    setSearchParams(params, { replace: true });
  }

  const selectWeek = (weekStart: string) => update({ week: weekStart });
  const hasStores = data !== undefined && data.stores.length > 0;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect
            id="store-dashboard-weeks"
            label={t('storeDashboard.weeksRange')}
            icon={<CalendarIcon className="h-4 w-4" />}
            value={String(weekCount)}
            onChange={(value) =>
              update({ weeks: value === String(DEFAULT_WEEK_COUNT) ? null : value })
            }
          >
            {WEEK_COUNTS.map((count) => (
              <option key={count} value={count}>
                {t('storeDashboard.weeksOption', { count })}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="store-dashboard-week-store"
            label={t('storeDashboard.store')}
            icon={<StoreIcon className="h-4 w-4" />}
            value={storeNr === null ? '' : String(storeNr)}
            onChange={(value) => update({ store: value === '' ? null : value })}
          >
            <option value="">{t('storeDashboard.allStores')}</option>
            {(data?.stores ?? []).map((store) => (
              <option key={store.nr} value={store.nr}>
                {storeLabel(store)}
              </option>
            ))}
          </FilterSelect>
          <CurrencySwitch
            value={currency}
            onChange={(next) => update({ currency: next === 'TMT' ? null : next })}
          />
        </div>
        {data ? <FreshnessLine refresh={data.refresh} /> : null}
      </div>

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

      {data && !hasStores && !query.isPlaceholderData ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('storeDashboard.weeklyEmpty')}
        </p>
      ) : null}

      {data && hasStores && kpi && selectedWeek ? (
        <div
          aria-busy={query.isPlaceholderData}
          className={`flex flex-col gap-4 transition-opacity ${
            query.isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <WeekNavigator
            week={selectedWeek}
            lastCompleteWeek={data.lastCompleteWeek}
            previous={weeks[weeks.indexOf(selectedWeek) - 1]?.weekStart ?? null}
            next={weeks[weeks.indexOf(selectedWeek) + 1]?.weekStart ?? null}
            onSelect={selectWeek}
          />

          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {data.kpis.map((entry) => (
              <WeekKpiCard
                key={entry.code}
                kpi={entry}
                week={weekOf(comparisonFor(entry, currency, storeNr), selectedWeek.weekStart)}
                currency={currency}
                active={entry.code === kpi.code}
                onSelect={() => update({ tab: entry.code })}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <KpiBadgeIcon code={kpi.code} size="sm" />
            <h2 className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {kpiNames(kpi, locale, t).label}
            </h2>
            {kpiNames(kpi, locale, t).number ? (
              <NumberChip number={kpiNames(kpi, locale, t).number ?? ''} />
            ) : null}
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-5">
            <div className={storeNr === null ? 'lg:col-span-3' : 'lg:col-span-5'}>
              <WeekList
                kpi={kpi}
                weeks={weeks}
                currency={currency}
                selected={selectedWeek.weekStart}
                onSelect={selectWeek}
              />
            </div>
            {storeNr === null ? (
              <div className="lg:col-span-2">
                <WeekStores
                  data={data}
                  kpi={kpi}
                  currency={currency}
                  selected={selectedWeek.weekStart}
                  onSelect={(nr) => update({ store: String(nr) })}
                />
              </div>
            ) : null}
          </div>

          <WeekChart
            kpi={kpi}
            weeks={weeks}
            currency={currency}
            selected={selectedWeek.weekStart}
            onSelect={selectWeek}
          />

          <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            {kpi.aggregation === 'average' ? <p>{t('storeDashboard.weeklyDistinctNote')}</p> : null}
            {kpi.aggregation === 'average' && storeNr === null && data.stores.length > 1 ? (
              <p>{t('storeDashboard.customersNote')}</p>
            ) : null}
            {kpi.aggregation === 'ratio' ? <p>{t('storeDashboard.weeklyConversionNote')}</p> : null}
            {kpi.code === 'STORE_VISITOR_COUNT' ? (
              <p>{t('storeDashboard.weeklyVisitorNote')}</p>
            ) : null}
            <p>{t('storeDashboard.weeklyAnalysisNote')}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
