import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { bulkCopyKpiTemplates, copyKpiTemplate, getKpiTemplate } from '../api/kpi-templates';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import { parseTargetChangePercent } from '../lib/kpi-target-change';
import type { KpiTemplateBulkCopyResponse } from '../types/api';
import { FormField, formInputClassName } from './FormField';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { TargetChangeField, TargetChangePreview } from './TargetChange';

/** Names in the "copying these templates" box before it says "+N more". */
const LISTED_NAMES = 6;

type TemplateCopy = KpiTemplateBulkCopyResponse['copies'][number];

function describeCopyError(error: unknown, t: Translate): string {
  if (error instanceof ApiError && error.body?.code === 'KPI_TEMPLATE_NAME_TAKEN') {
    return t('kpiTemplateForm.nameTaken');
  }

  return localizeApiError(error, t, 'kpiTemplateForm.copyError');
}

interface CopyKpiTemplateModalProps {
  templates: ReadonlyArray<{ id: string; name: string }>;
  onClose: () => void;
  onCopied: (copies: TemplateCopy[], targetChangePercent: number) => void;
}

/**
 * Copies one template (with its rows as a live preview and an optional new name) or a
 * whole selection, changing the default targets by a percentage on the way (ADR-070).
 */
export function CopyKpiTemplateModal({ templates, onClose, onCopied }: CopyKpiTemplateModalProps) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const single = templates.length === 1 ? templates[0] : undefined;
  const [percentText, setPercentText] = useState('0');
  const [name, setName] = useState('');
  const percent = parseTargetChangePercent(percentText);

  // Same key as the template form, so opening it from there reads the cached template.
  const templateQuery = useQuery({
    queryKey: ['kpi-templates', single?.id],
    queryFn: () => getKpiTemplate(single?.id as string),
    enabled: single !== undefined,
  });

  const copyMutation = useMutation({
    mutationFn: async (targetChangePercent: number): Promise<TemplateCopy[]> => {
      if (single) {
        const trimmed = name.trim();
        const copy = await copyKpiTemplate(single.id, {
          ...(trimmed === '' ? {} : { name: trimmed }),
          targetChangePercent,
        });

        return [{ sourceId: single.id, id: copy.id, name: copy.name }];
      }

      return (
        await bulkCopyKpiTemplates(
          templates.map((template) => template.id),
          targetChangePercent,
        )
      ).copies;
    },
    onSuccess: (copies, targetChangePercent) => onCopied(copies, targetChangePercent),
    // A bulk copy goes in chunks of 100; the earlier chunks are saved even when one fails.
    onError: () => void queryClient.invalidateQueries({ queryKey: ['kpi-templates'] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();

    if (percent !== null && !copyMutation.isPending) {
      copyMutation.mutate(percent);
    }
  }

  const count = formatNumber(templates.length, locale);
  const items = templateQuery.data?.items ?? [];
  const targetCount = items.filter((item) => item.targetValue !== null).length;

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={single ? t('kpiCopy.templateTitle') : t('kpiCopy.templatesTitle', { count })}
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        {single ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('kpiCopy.templateSource', { name: single.name })}
            </p>
            <FormField
              label={t('kpiCopy.nameLabel')}
              htmlFor="copy-template-name"
              hint={t('kpiCopy.nameHint', { name: `${single.name} (2)` })}
            >
              <input
                id="copy-template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                autoComplete="off"
                placeholder={t('kpiCopy.namePlaceholder')}
                className={formInputClassName}
              />
            </FormField>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('kpiCopy.templatesList')}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {templates.slice(0, LISTED_NAMES).map((template) => (
                <li
                  key={template.id}
                  className="max-w-full truncate rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                >
                  {template.name}
                </li>
              ))}
              {templates.length > LISTED_NAMES ? (
                <li className="rounded-full px-2 py-1 text-sm text-slate-500 dark:text-slate-400">
                  {t('kpiCopy.moreTemplates', {
                    count: formatNumber(templates.length - LISTED_NAMES, locale),
                  })}
                </li>
              ) : null}
            </ul>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('kpiCopy.templatesNameHint')}
            </p>
          </div>
        )}

        <TargetChangeField
          id="copy-template-change"
          text={percentText}
          onTextChange={setPercentText}
        />

        {single ? (
          <section aria-labelledby="copy-template-preview">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                id="copy-template-preview"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                {t('kpiCopy.previewTitle')}
              </h3>
              {templateQuery.data ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('kpiCopy.previewTargets', {
                    targets: formatNumber(targetCount, locale),
                    items: formatNumber(items.length, locale),
                  })}
                </span>
              ) : null}
            </div>
            {templateQuery.isLoading ? (
              <p className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
                <Spinner />
                {t('kpiCopy.previewLoading')}
              </p>
            ) : templateQuery.isError ? (
              <p className="py-4 text-sm text-red-600 dark:text-red-400">
                {t('kpiCopy.previewError')}
              </p>
            ) : targetCount === 0 ? (
              <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t('kpiCopy.noDefaultTargets')}
              </p>
            ) : (
              <TargetChangePreview items={items} percent={percent ?? 0} />
            )}
          </section>
        ) : null}

        <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {t('kpiCopy.roundingNote')}
        </p>

        {/* Inside the scrolling body, the actions stay at the bottom edge within thumb reach. */}
        <div className="sticky bottom-0 -mx-5 mt-auto border-t border-slate-200 bg-white px-5 pt-3 dark:border-slate-800 dark:bg-slate-900">
          {copyMutation.isError ? (
            <p
              role="alert"
              className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {describeCopyError(copyMutation.error, t)}
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
              disabled={percent === null || copyMutation.isPending}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
            >
              {copyMutation.isPending ? <Spinner /> : null}
              {copyMutation.isPending
                ? t('kpiCopy.copying')
                : single
                  ? t('kpiCopy.copyTemplate')
                  : t('kpiCopy.copyTemplates', { count })}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
