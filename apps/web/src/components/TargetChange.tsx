import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import { pickLocalizedText } from '../i18n/localized-text';
import {
  MAX_TARGET_CHANGE_PERCENT,
  MIN_TARGET_CHANGE_PERCENT,
  TARGET_CHANGE_PRESETS,
  changeTarget,
  parseTargetChangePercent,
} from '../lib/kpi-target-change';
import type { KpiPlanItem, KpiTemplateItem } from '../types/api';

/** A percentage as people write it in the selected language: "+%10", "+10%", "+10 %". */
export function formatChangePercent(percent: number, locale: Locale): string {
  return formatNumber(percent / 100, locale, {
    style: 'percent',
    signDisplay: 'exceptZero',
    maximumFractionDigits: 2,
  });
}

/** "Hedefler %10 artırıldı." after a copy; null when the targets were copied as they were. */
export function describeTargetChange(percent: number, t: Translate, locale: Locale): string | null {
  if (percent === 0) {
    return null;
  }

  const value = formatNumber(Math.abs(percent), locale, { maximumFractionDigits: 2 });

  return t(percent > 0 ? 'kpiCopy.changedUp' : 'kpiCopy.changedDown', { value });
}

function ArrowIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      className={className}
    >
      <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendIcon({ up }: { up: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      className="h-4 w-4 flex-shrink-0"
    >
      {up ? (
        <path d="m4 16 6-6 4 4 6-6m0 0h-5m5 0v5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="m4 8 6 6 4-4 6 6m0 0h-5m5 0v-5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Puts a number into the field the way the selected language writes it ("7,5" in Turkish). */
function toFieldText(percent: number, locale: Locale): string {
  return formatNumber(percent, locale, { maximumFractionDigits: 2, useGrouping: false });
}

interface TargetChangeFieldProps {
  id: string;
  text: string;
  onTextChange: (text: string) => void;
}

/**
 * How much the copied targets change, in percent (ADR-070): a big field with − and +
 * steps, one-tap presets and a sentence that says what will happen. 0 copies as they are.
 */
export function TargetChangeField({ id, text, onTextChange }: TargetChangeFieldProps) {
  const { t, locale } = useTranslation();
  const percent = parseTargetChangePercent(text);
  // "%10" in Turkish, "10%" in English: the sign sits where the language puts it.
  const percentBefore = t('kpiProgress.percent', { value: '1' }).startsWith('%');
  const summaryId = `${id}-summary`;

  function step(delta: number) {
    const next = Math.round((percent ?? 0) + delta);
    const clamped = Math.min(MAX_TARGET_CHANGE_PERCENT, Math.max(MIN_TARGET_CHANGE_PERCENT, next));
    onTextChange(toFieldText(clamped, locale));
  }

  const stepClassName =
    'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-300 text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800';
  const tone =
    percent === null
      ? 'border-red-400 focus-within:ring-red-400/30'
      : percent > 0
        ? 'border-emerald-400 focus-within:ring-emerald-400/30'
        : percent < 0
          ? 'border-amber-400 focus-within:ring-amber-400/30'
          : 'border-slate-300 focus-within:ring-emerald-400/30 dark:border-slate-700';

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {t('kpiCopy.changeLabel')}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={percent !== null && percent <= MIN_TARGET_CHANGE_PERCENT}
          aria-label={t('kpiCopy.decrease')}
          className={stepClassName}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-5 w-5"
          >
            <path d="M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
        {/* The whole box focuses the field; its own text is only the hidden % sign. */}
        <label
          htmlFor={id}
          className={`flex h-14 min-w-0 flex-1 cursor-text items-center justify-center gap-1 rounded-2xl border bg-white px-3 transition focus-within:ring-2 dark:bg-slate-950 ${tone}`}
        >
          {percentBefore ? (
            <span aria-hidden="true" className="text-xl font-semibold text-slate-400">
              %
            </span>
          ) : null}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            onFocus={(event) => event.target.select()}
            aria-invalid={percent === null}
            aria-describedby={summaryId}
            // As wide as its text, so the % sign stays right beside the number.
            style={{ width: `${Math.max(text.length, 1) + 0.5}ch` }}
            className="min-w-[2ch] max-w-full bg-transparent text-center text-2xl font-semibold text-slate-900 outline-none dark:text-slate-100"
          />
          {percentBefore ? null : (
            <span aria-hidden="true" className="text-xl font-semibold text-slate-400">
              %
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={percent !== null && percent >= MAX_TARGET_CHANGE_PERCENT}
          aria-label={t('kpiCopy.increase')}
          className={stepClassName}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-5 w-5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* One row of six on a phone; wider screens let the chips keep their own width. */}
      <div
        role="group"
        aria-label={t('kpiCopy.presets')}
        className="mt-3 grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:gap-2"
      >
        {TARGET_CHANGE_PRESETS.map((preset) => {
          const active = percent === preset;

          return (
            <button
              key={preset}
              type="button"
              aria-pressed={active}
              onClick={() => onTextChange(toFieldText(preset, locale))}
              className={`h-11 min-w-0 rounded-full border px-1 text-sm font-semibold tabular-nums transition sm:min-w-[3.75rem] sm:px-3 ${
                active
                  ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                  : 'border-slate-300 text-slate-700 hover:border-emerald-400 hover:bg-emerald-400/10 dark:border-slate-700 dark:text-slate-200'
              }`}
            >
              {formatChangePercent(preset, locale)}
            </button>
          );
        })}
      </div>

      <p
        id={summaryId}
        aria-live="polite"
        className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${
          percent === null
            ? 'text-red-600 dark:text-red-400'
            : percent > 0
              ? 'text-emerald-700 dark:text-emerald-300'
              : percent < 0
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {percent !== null && percent !== 0 ? <TrendIcon up={percent > 0} /> : null}
        {percent === null
          ? t('kpiCopy.rangeError', {
              min: formatChangePercent(MIN_TARGET_CHANGE_PERCENT, locale),
              max: formatChangePercent(MAX_TARGET_CHANGE_PERCENT, locale),
            })
          : percent === 0
            ? t('kpiCopy.summaryKeep')
            : t(percent > 0 ? 'kpiCopy.summaryUp' : 'kpiCopy.summaryDown', {
                value: formatNumber(Math.abs(percent), locale, { maximumFractionDigits: 2 }),
              })}
      </p>
    </div>
  );
}

type PreviewItem = Pick<
  KpiTemplateItem | KpiPlanItem,
  'id' | 'definition' | 'weight' | 'targetValue' | 'inputValues'
>;

function formatTarget(value: number, item: PreviewItem, t: Translate, locale: Locale): string {
  if (item.definition.unit === 'percent') {
    return t('kpiProgress.percent', {
      value: formatNumber(value, locale, { maximumFractionDigits: 2 }),
    });
  }

  const number = formatNumber(value, locale, { maximumFractionDigits: 4 });
  const currency = item.inputValues.currency;

  return typeof currency === 'string' ? `${number} ${currency}` : number;
}

/**
 * The rows being copied, each with its target now and after the change. With 0% the
 * targets are shown as they are; a row without a target says so and stays without one.
 */
export function TargetChangePreview({
  items,
  percent,
}: {
  items: readonly PreviewItem[];
  percent: number;
}) {
  const { t, locale } = useTranslation();

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => {
        const { unit } = item.definition;
        const before = item.targetValue;
        const after = changeTarget(before, percent, unit);
        const changed = before !== null && after !== null && after !== before;
        const delta = changed ? after - before : 0;
        const capped =
          unit === 'percent' &&
          before !== null &&
          percent > 0 &&
          after === 100 &&
          (before * (100 + percent)) / 100 > 100;

        return (
          <li key={item.id} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {pickLocalizedText(item.definition.name, locale)}
              </p>
              <span className="flex-shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {t('kpiCopy.weight', {
                  value: t('kpiProgress.percent', { value: formatNumber(item.weight, locale) }),
                })}
              </span>
            </div>
            {before === null ? (
              <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">
                {t('kpiCopy.noTarget')}
              </p>
            ) : (
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums">
                {changed ? (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatTarget(before, item, t, locale)}
                    </span>
                    <ArrowIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  </>
                ) : null}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatTarget(after ?? before, item, t, locale)}
                </span>
                {changed && unit !== 'percent' ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                      delta > 0
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {formatNumber(delta, locale, {
                      signDisplay: 'always',
                      maximumFractionDigits: 2,
                    })}
                  </span>
                ) : null}
                {capped ? (
                  <span className="ml-auto rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t('kpiCopy.capped')}
                  </span>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
