import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { copyKpiPlans, getKpiPlan, listKpiPlans } from '../api/kpi-plans';
import { formatMonth, formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { parseTargetChangePercent } from '../lib/kpi-target-change';
import type { KpiPeriod, KpiPlanCopyResult } from '../types/api';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { TargetChangeField, TargetChangePreview } from './TargetChange';

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      className="h-5 w-5"
    >
      <path
        d={direction === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CopyKpiPlansModalProps {
  /** The open period the plans are copied into. */
  period: KpiPeriod;
  periods: readonly KpiPeriod[];
  defaultSourceId: string;
  describeError: (error: unknown) => string;
  onClose: () => void;
  onCopied: (result: KpiPlanCopyResult, targetChangePercent: number) => void;
}

/**
 * Copies another month's plans into this one (ADR-039) with their targets changed by a
 * percentage (ADR-070). Any earlier plan of the source month can be browsed as an example
 * of what the change does to real targets before anything is written.
 */
export function CopyKpiPlansModal({
  period,
  periods,
  defaultSourceId,
  describeError,
  onClose,
  onCopied,
}: CopyKpiPlansModalProps) {
  const { t, locale } = useTranslation();
  const [sourceId, setSourceId] = useState(defaultSourceId);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [percentText, setPercentText] = useState('0');
  const percent = parseTargetChangePercent(percentText);
  const sources = periods.filter((item) => item.id !== period.id);
  const source = sources.find((item) => item.id === sourceId);
  const planCount = source?.assignmentCount ?? 0;

  // The first page of the source month is enough to browse examples.
  const sourcePlansQuery = useQuery({
    queryKey: ['kpi-plans', 'period', sourceId, 'copy-preview'],
    queryFn: () => listKpiPlans(sourceId, 1),
    enabled: planCount > 0,
  });
  const samples = sourcePlansQuery.data?.items ?? [];
  const sample = samples[Math.min(sampleIndex, samples.length - 1)];

  // Same key as the plan form, so a plan opened there before comes from the cache.
  const sampleQuery = useQuery({
    queryKey: ['kpi-plans', 'detail', sample?.id],
    queryFn: () => getKpiPlan(sample?.id as string),
    enabled: sample !== undefined,
    placeholderData: keepPreviousData,
  });

  const copyMutation = useMutation({
    mutationFn: (targetChangePercent: number) =>
      copyKpiPlans(period.id, sourceId, targetChangePercent),
    onSuccess: (result, targetChangePercent) => onCopied(result, targetChangePercent),
  });

  function selectSource(id: string) {
    setSourceId(id);
    setSampleIndex(0);
    copyMutation.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    if (percent !== null && planCount > 0 && !copyMutation.isPending) {
      copyMutation.mutate(percent);
    }
  }

  const tileClassName = 'flex min-w-0 flex-col rounded-2xl border px-3 py-2.5 dark:bg-slate-950/40';
  const sampleItems = sampleQuery.data?.items ?? [];

  return (
    <Modal open size="lg" onClose={onClose} title={t('kpiCopy.plansTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        {/* From → to: the source month is chosen in its own tile. */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
          <label
            className={`${tileClassName} border-slate-300 bg-white focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/30 dark:border-slate-700`}
          >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('kpiCopy.sourceLabel')}
            </span>
            <select
              value={sourceId}
              onChange={(event) => selectSource(event.target.value)}
              className="-mx-1 h-11 min-w-0 cursor-pointer rounded-lg bg-transparent px-1 text-base font-semibold text-slate-900 outline-none dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-slate-900"
            >
              {sources.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatMonth(item.label, locale)}
                </option>
              ))}
            </select>
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {t('kpiPlans.periodPlans', { count: formatNumber(planCount, locale) })}
            </span>
          </label>
          <span
            aria-hidden="true"
            className="flex items-center justify-center text-emerald-600 dark:text-emerald-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              className="h-6 w-6"
            >
              <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className={`${tileClassName} border-emerald-400/50 bg-emerald-400/5`}>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('kpiCopy.targetLabel')}
            </span>
            <span className="flex h-11 items-center truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {formatMonth(period.label, locale)}
            </span>
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {t('kpiPlans.periodPlans', { count: formatNumber(period.assignmentCount, locale) })}
            </span>
          </div>
        </div>

        <TargetChangeField
          id="copy-plans-change"
          text={percentText}
          onTextChange={setPercentText}
        />

        <section aria-labelledby="copy-plans-preview">
          <h3
            id="copy-plans-preview"
            className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            {t('kpiCopy.sampleTitle')}
          </h3>

          {planCount === 0 ? (
            <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {t('kpiCopy.sourceEmpty')}
            </p>
          ) : sourcePlansQuery.isError || sampleQuery.isError ? (
            <p className="py-4 text-sm text-red-600 dark:text-red-400">
              {t('kpiCopy.previewError')}
            </p>
          ) : !sample ? (
            <p className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
              <Spinner />
              {t('kpiCopy.previewLoading')}
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2 rounded-2xl bg-slate-50 p-1.5 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setSampleIndex((index) => Math.max(0, index - 1))}
                  disabled={sampleIndex === 0}
                  aria-label={t('kpiCopy.previousSample')}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronIcon direction="left" />
                </button>
                <div className="min-w-0 flex-1 text-center" aria-live="polite">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {`${sample.employee.firstname} ${sample.employee.lastname}`.trim()}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {sample.templateName}
                    {' · '}
                    {t('kpiCopy.samplePosition', {
                      index: formatNumber(sampleIndex + 1, locale),
                      total: formatNumber(samples.length, locale),
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSampleIndex((index) => Math.min(samples.length - 1, index + 1))}
                  disabled={sampleIndex >= samples.length - 1}
                  aria-label={t('kpiCopy.nextSample')}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
              <div
                className={`transition-opacity ${sampleQuery.isPlaceholderData ? 'opacity-50' : ''}`}
              >
                {sampleItems.length > 0 ? (
                  <TargetChangePreview items={sampleItems} percent={percent ?? 0} />
                ) : (
                  <p className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
                    <Spinner />
                    {t('kpiCopy.previewLoading')}
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <ul className="flex flex-col gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <li>{t('kpiCopy.skipNote')}</li>
          <li>{t('kpiCopy.roundingNote')}</li>
        </ul>

        <div className="sticky bottom-0 -mx-5 mt-auto border-t border-slate-200 bg-white px-5 pt-3 dark:border-slate-800 dark:bg-slate-900">
          {copyMutation.isError ? (
            <p
              role="alert"
              className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {describeError(copyMutation.error)}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={percent === null || planCount === 0 || copyMutation.isPending}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
            >
              {copyMutation.isPending ? <Spinner /> : null}
              {copyMutation.isPending
                ? t('kpiCopy.copying')
                : t('kpiCopy.copyPlans', { count: formatNumber(planCount, locale) })}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
