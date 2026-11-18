import type { ReactNode } from 'react';

import { formatDateTime, formatNumber } from '../i18n/formatters';
import { pickLocalizedText } from '../i18n/localized-text';
import { useTranslation } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import type { StoreDashboardKpi, StoreDashboardResponse } from '../types/api';
import { StoreKpiIcon, storeKpiShortName } from './StoreKpiIcon';

/** What the monthly and the weekly store dashboard (ADR-061, ADR-071) show alike. */

export type Currency = 'TMT' | 'USD';
export type Store = StoreDashboardResponse['stores'][number];
export type Translate = ReturnType<typeof useTranslation>['t'];
/** What a KPI's values are formatted by; the monthly and weekly KPIs both have it. */
type KpiFormat = Pick<StoreDashboardKpi, 'unit' | 'aggregation'>;

export const CURRENCIES: Currency[] = ['TMT', 'USD'];

/** "#1 Mağaza bazında ciro" → "#1" and the rest; KPI names carry their number (ADR-060). */
function splitCatalogName(name: string): { number: string | null; label: string } {
  const match = /^(#\d+)\s+(.+)$/.exec(name);

  return match?.[1] && match[2]
    ? { number: match[1], label: match[2] }
    : { number: null, label: name };
}

/** What a KPI is called on screen: its catalog number, full name and short name. */
export function kpiNames(
  kpi: Pick<StoreDashboardKpi, 'code' | 'name'>,
  locale: Locale,
  t: Translate,
): { number: string | null; full: string; label: string; short: string } {
  const full = pickLocalizedText(kpi.name, locale);
  const { number, label } = splitCatalogName(full);
  const shortKey = storeKpiShortName(kpi.code);

  return { number, full, label, short: shortKey ? t(shortKey) : label };
}

/** The KPI's icon on a tinted square; the emphasis follows the active tab or card. */
export function KpiBadgeIcon({ code, size = 'md' }: { code: string | null; size?: 'sm' | 'md' }) {
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

export function storeLabel(store: Store): string {
  return store.name ? `${String(store.nr)} · ${store.name}` : String(store.nr);
}

/** Fraction digits of a value: rates keep two, averages one, everything else is whole. */
export function valueDigits(kpi: KpiFormat): number {
  return kpi.aggregation === 'ratio' ? 2 : kpi.aggregation === 'average' ? 1 : 0;
}

/** Money with its currency, a rate as a percentage, a count as it is. */
export function formatValue(
  value: number | null,
  kpi: KpiFormat,
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
export function formatDifference(
  value: number,
  kpi: KpiFormat,
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

export function formatGrowth(value: number, locale: Locale, t: Translate, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  return (
    sign +
    t('storeDashboard.percent', {
      value: formatNumber(Math.abs(value), locale, { maximumFractionDigits: digits }),
    })
  );
}

export function growthTone(value: number | null): string {
  if (value === null || value === 0) {
    return 'text-slate-500 dark:text-slate-400';
  }

  return value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

export function barPercent(value: number | null, max: number): number {
  return value === null || value <= 0 ? 0 : Math.max(3, (value / max) * 100);
}

export function barHeight(value: number | null, max: number): string {
  return `${String(barPercent(value, max))}%`;
}

export function TrendArrow({ up, className = '' }: { up: boolean; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={className} fill="currentColor">
      <path d={up ? 'M6 2l4 5H2z' : 'M6 10L2 5h8z'} />
    </svg>
  );
}

export function ChevronRightIcon({ className = '' }: { className?: string }) {
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
export function GrowthBadge({
  value,
  compact = false,
  digits = 1,
}: {
  value: number | null;
  compact?: boolean;
  digits?: number;
}) {
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
      {formatGrowth(value, locale, t, digits)}
    </span>
  );
}

/** The catalog number (ADR-060), kept small next to the name. */
export function NumberChip({ number }: { number: string }) {
  return (
    <span className="flex-shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {number}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </section>
  );
}

export function FreshnessLine({ refresh }: { refresh: StoreDashboardResponse['refresh'] }) {
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

export function InProgressChip({ className = '' }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <span
      className={`whitespace-nowrap rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 ${className}`}
    >
      {t('storeDashboard.inProgressShort')}
    </span>
  );
}

export function CurrencySwitch({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('storeDashboard.currency')}
      className="col-span-2 flex h-11 w-full rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 sm:w-auto"
    >
      {CURRENCIES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`flex-1 rounded-full px-4 text-sm font-semibold transition sm:flex-none ${
            value === option
              ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
              : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
