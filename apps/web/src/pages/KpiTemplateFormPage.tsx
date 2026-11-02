import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { listKpiDefinitions } from '../api/kpi-definitions';
import {
  createKpiTemplate,
  deactivateKpiTemplate,
  deleteKpiTemplate,
  getKpiTemplate,
  updateKpiTemplate,
} from '../api/kpi-templates';
import { AppShell } from '../components/AppShell';
import { CopyKpiTemplateModal } from '../components/CopyKpiTemplateModal';
import { FormField, formInputClassName } from '../components/FormField';
import { KpiTemplateItemEditor } from '../components/KpiTemplateItemEditor';
import { Spinner } from '../components/Spinner';
import { describeTargetChange } from '../components/TargetChange';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import { ApiError } from '../lib/api-client';
import {
  type DraftError,
  REQUIRED_TOTAL_WEIGHT,
  type TemplateDraft,
  type TemplateItemDraft,
  draftFromTemplate,
  emptyItemDraft,
  saveInputFromTemplate,
  toSaveInput,
  totalWeight,
  validateDraft,
} from '../lib/kpi-template-form';
import type { KpiTemplate, SaveKpiTemplateInput } from '../types/api';
import { confirmAction } from '../store/confirm-store';

function describeDraftError(error: DraftError, t: Translate, locale: Locale): string {
  const params = { ...error.params };

  if (typeof params.total === 'number') {
    params.total = formatNumber(params.total, locale);
  }

  return t(error.key, params);
}

/** Maps the API's business error `code` (ADR-034) to a message in the selected language. */
function describeSaveError(error: unknown, t: Translate, locale: Locale): string {
  if (error instanceof ApiError && error.body?.code) {
    const body = error.body;
    const number = (body.itemIndex ?? 0) + 1;

    switch (body.code) {
      case 'KPI_TEMPLATE_WEIGHT_TOTAL':
        return describeDraftError(
          {
            key:
              (body.totalWeight ?? 0) > REQUIRED_TOTAL_WEIGHT
                ? 'kpiTemplateForm.weightOver'
                : 'kpiTemplateForm.weightUnder',
            params: { total: body.totalWeight ?? 0 },
          },
          t,
          locale,
        );
      case 'KPI_TEMPLATE_UNKNOWN_DEFINITION':
        return t('kpiTemplateForm.unknownDefinition', { number });
      case 'KPI_TEMPLATE_INVALID_INPUT':
        return t('kpiTemplateForm.invalidInput', { number });
      case 'KPI_TEMPLATE_UNKNOWN_STORE':
        return t('kpiTemplateForm.unknownStore', { number });
      case 'KPI_TEMPLATE_UNKNOWN_ITEM_GROUP':
        return t('kpiTemplateForm.unknownItemGroup', {
          number,
          codes: (body.groupCodes ?? []).join(', '),
        });
      case 'KPI_TEMPLATE_DUPLICATE_ITEM':
        return t('kpiTemplateForm.duplicateItem', {
          number,
          other: (body.duplicateOf ?? 0) + 1,
        });
      case 'KPI_TEMPLATE_NAME_TAKEN':
        return t('kpiTemplateForm.nameTaken');
    }
  }

  return localizeApiError(error, t, 'kpiTemplateForm.genericSaveError', {
    409: 'kpiTemplateForm.nameTaken',
  });
}

/** `KPI_TEMPLATE_IN_USE` says how many KPI plans still point at the template (ADR-040). */
function describeDeleteError(error: unknown, t: Translate): string {
  if (error instanceof ApiError && error.body?.code === 'KPI_TEMPLATE_IN_USE') {
    const planCount = error.body.templates?.[0]?.planCount ?? 0;

    return t('kpiTemplateForm.deleteInUse', { count: String(planCount) });
  }

  return localizeApiError(error, t, 'kpiTemplateForm.deleteError');
}

function newDraft(): TemplateDraft {
  return { name: '', description: '', items: [emptyItemDraft()] };
}

interface CopyNavigationState {
  copiedFrom?: string;
  /** How much the copy changed the default targets (ADR-070). */
  targetChangePercent?: number;
}

export function KpiTemplateFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();

  // Opening a copy reuses this route element; a new key resets the form and mutations.
  return <KpiTemplateForm key={id ?? 'new'} mode={mode} id={id} />;
}

function KpiTemplateForm({ mode, id }: { mode: 'create' | 'edit'; id: string | undefined }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t, locale } = useTranslation();
  const copyState = location.state as CopyNavigationState | null;
  const copiedFrom = copyState?.copiedFrom;
  const copiedChange = describeTargetChange(copyState?.targetChangePercent ?? 0, t, locale);
  const [copyOpen, setCopyOpen] = useState(false);

  const [draft, setDraft] = useState<TemplateDraft>(newDraft);
  const [draftError, setDraftError] = useState<DraftError | null>(null);

  const templateQuery = useQuery({
    queryKey: ['kpi-templates', id],
    queryFn: () => getKpiTemplate(id as string),
    enabled: mode === 'edit' && Boolean(id),
  });

  // The full catalog supplies every item's input schema, whatever its search box shows.
  const definitionsQuery = useQuery({
    queryKey: ['kpi-definitions', ''],
    queryFn: () => listKpiDefinitions(''),
  });
  const definitionsById = useMemo(
    () =>
      new Map(
        (definitionsQuery.data ?? []).map((definition) => [
          definition.id.toLowerCase(),
          definition,
        ]),
      ),
    [definitionsQuery.data],
  );

  useEffect(() => {
    if (templateQuery.data) {
      setDraft(draftFromTemplate(templateQuery.data));
    }
  }, [templateQuery.data]);

  async function refreshTemplates() {
    await queryClient.invalidateQueries({ queryKey: ['kpi-templates'] });
  }

  const saveMutation = useMutation({
    mutationFn: (input: SaveKpiTemplateInput) =>
      mode === 'create' ? createKpiTemplate(input) : updateKpiTemplate(id as string, input),
    onSuccess: async () => {
      await refreshTemplates();
      void navigate('/kpi-templates', { replace: true });
    },
  });

  // Permanent delete; the API refuses it while a KPI plan uses the template (ADR-040).
  const deleteMutation = useMutation({
    mutationFn: () => deleteKpiTemplate(id as string),
    onSuccess: async () => {
      await refreshTemplates();
      void navigate('/kpi-templates', { replace: true });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateKpiTemplate(id as string),
    onSuccess: async () => {
      await refreshTemplates();
      void navigate('/kpi-templates', { replace: true });
    },
  });

  // Reactivates the saved version so unsaved edits are not persisted as a side effect.
  const reactivateMutation = useMutation({
    mutationFn: (template: KpiTemplate) =>
      updateKpiTemplate(template.id, { ...saveInputFromTemplate(template), isActive: true }),
    onSuccess: refreshTemplates,
  });

  // The modal copies the saved version on the server; then the copy opens for editing.
  async function openCopy(copyId: string, sourceName: string, targetChangePercent: number) {
    setCopyOpen(false);
    await refreshTemplates();
    const state: CopyNavigationState = { copiedFrom: sourceName, targetChangePercent };
    void navigate(`/kpi-templates/${copyId}`, { state });
  }

  function resetFeedback() {
    setDraftError(null);
    saveMutation.reset();
    deactivateMutation.reset();
    deleteMutation.reset();
    reactivateMutation.reset();
  }
  async function removeTemplate(name: string) {
    resetFeedback();

    if (
      await confirmAction({ message: t('kpiTemplateForm.deleteConfirm', { name }), tone: 'danger' })
    ) {
      deleteMutation.mutate();
    }
  }

  function updateItem(index: number, item: TemplateItemDraft) {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((current, currentIndex) =>
        currentIndex === index ? item : current,
      ),
    }));
  }

  function removeItem(index: number) {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    resetFeedback();

    const error = validateDraft(draft, definitionsById, locale);
    setDraftError(error);

    if (!error) {
      saveMutation.mutate(toSaveInput(draft));
    }
  }

  const total = totalWeight(draft.items);
  const weightState =
    total === REQUIRED_TOTAL_WEIGHT ? 'ok' : total > REQUIRED_TOTAL_WEIGHT ? 'over' : 'under';
  const weightParams = {
    total: formatNumber(total, locale),
    difference: formatNumber(
      Math.abs(REQUIRED_TOTAL_WEIGHT * 100 - Math.round(total * 100)) / 100,
      locale,
    ),
  };
  const weightMessage =
    weightState === 'ok'
      ? t('kpiTemplateForm.totalWeight', weightParams)
      : weightState === 'over'
        ? t('kpiTemplateForm.totalWeightOver', weightParams)
        : t('kpiTemplateForm.totalWeightUnder', weightParams);
  // The live total line is the only weight message; a rejected save just turns it red.
  const isWeightDraftError =
    draftError?.key === 'kpiTemplateForm.weightOver' ||
    draftError?.key === 'kpiTemplateForm.weightUnder';
  const pageTitle =
    mode === 'create' ? t('kpiTemplateForm.titleCreate') : t('kpiTemplateForm.titleEdit');
  const template = templateQuery.data;

  const formError = draftError
    ? isWeightDraftError
      ? null
      : describeDraftError(draftError, t, locale)
    : saveMutation.isError
      ? describeSaveError(saveMutation.error, t, locale)
      : deleteMutation.isError
        ? describeDeleteError(deleteMutation.error, t)
        : deactivateMutation.isError
          ? localizeApiError(deactivateMutation.error, t, 'kpiTemplateForm.deactivateError')
          : reactivateMutation.isError
            ? describeSaveError(reactivateMutation.error, t, locale)
            : null;

  return (
    <AppShell
      title={pageTitle}
      breadcrumbs={[{ label: t('kpiTemplates.title'), to: '/kpi-templates' }, { label: pageTitle }]}
      recordInfo={
        mode === 'edit' && template
          ? { tableName: 'kpi_templates', recordId: template.id, title: template.name }
          : undefined
      }
    >
      {mode === 'edit' && templateQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('kpiTemplateForm.loading')}
        </p>
      ) : templateQuery.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {localizeApiError(templateQuery.error, t, 'kpiTemplateForm.errorLoading')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {copiedFrom && template ? (
            <p
              role="status"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200"
            >
              {t('kpiTemplateForm.copiedNotice', { name: copiedFrom })}
              {copiedChange ? ` ${copiedChange}` : ''}
            </p>
          ) : null}

          {template && !template.isActive ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('kpiTemplateForm.inactiveNotice')}
              </p>
              <button
                type="button"
                disabled={reactivateMutation.isPending}
                onClick={() => {
                  resetFeedback();
                  reactivateMutation.mutate(template);
                }}
                className="h-11 rounded-xl border border-emerald-400/40 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-400/10 disabled:opacity-60 dark:text-emerald-300"
              >
                {reactivateMutation.isPending
                  ? t('kpiTemplateForm.reactivating')
                  : t('kpiTemplateForm.reactivate')}
              </button>
            </div>
          ) : null}

          <FormField label={t('kpiTemplateForm.nameLabel')} htmlFor="templateName" required>
            <input
              id="templateName"
              required
              maxLength={200}
              autoComplete="off"
              placeholder={t('kpiTemplateForm.namePlaceholder')}
              value={draft.name}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, name: event.target.value }))
              }
              className={formInputClassName}
            />
          </FormField>

          <FormField label={t('kpiTemplateForm.descriptionLabel')} htmlFor="templateDescription">
            <textarea
              id="templateDescription"
              rows={3}
              maxLength={1000}
              value={draft.description}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, description: event.target.value }))
              }
              className={`${formInputClassName} h-auto min-h-24 py-3`}
            />
          </FormField>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t('kpiTemplateForm.itemsTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('kpiTemplateForm.itemsHint')}
              </p>
            </div>
          </div>

          {definitionsQuery.isError ? (
            <p role="alert" className="text-xs text-red-500 dark:text-red-400">
              {t('kpiTemplateForm.definitionsError')}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {draft.items.map((item, index) => (
              <KpiTemplateItemEditor
                key={item.key}
                number={index + 1}
                item={item}
                definitionsById={definitionsById}
                onChange={(next) => updateItem(index, next)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setDraft((previous) => ({
                ...previous,
                items: [...previous.items, emptyItemDraft()],
              }))
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/60 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-400/10 dark:text-emerald-300"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-4 w-4"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            {t('kpiTemplateForm.addItem')}
          </button>

          {mode === 'edit' && template ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  resetFeedback();
                  setCopyOpen(true);
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 text-base font-semibold text-emerald-700 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" strokeLinecap="round" />
                </svg>
                {t('kpiTemplateForm.copy')}
              </button>
              <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('kpiTemplateForm.copyHint')}
              </p>
            </div>
          ) : null}

          {mode === 'edit' && template?.isActive ? (
            <button
              type="button"
              disabled={deactivateMutation.isPending}
              onClick={() => {
                resetFeedback();
                deactivateMutation.mutate();
              }}
              className="mt-2 h-12 w-full rounded-xl border border-red-500/30 text-base font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400"
            >
              {deactivateMutation.isPending
                ? t('kpiTemplateForm.deactivating')
                : t('kpiTemplateForm.deactivate')}
            </button>
          ) : null}

          {mode === 'edit' && template ? (
            <>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => void removeTemplate(template.name)}
                className="mt-2 h-12 w-full rounded-xl bg-red-500/10 text-base font-semibold text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400"
              >
                {deleteMutation.isPending
                  ? t('kpiTemplateForm.deleting')
                  : t('kpiTemplateForm.delete')}
              </button>
              <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('kpiTemplateForm.deleteHint')}
              </p>
            </>
          ) : null}

          {/* Sticky footer keeps the running total and the primary action within thumb reach. */}
          <div className="sticky bottom-0 -mx-4 mt-2 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <p
              role="status"
              aria-live="polite"
              className={`mb-2 text-sm font-semibold ${
                weightState === 'ok'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : weightState === 'over' || isWeightDraftError
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {weightMessage}
            </p>

            {formError ? (
              <p
                role="alert"
                className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="h-12 w-full rounded-xl bg-emerald-400 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {saveMutation.isPending ? <Spinner /> : null}
                {saveMutation.isPending ? t('kpiTemplateForm.saving') : t('kpiTemplateForm.save')}
              </span>
            </button>
          </div>
        </form>
      )}

      {copyOpen && template ? (
        <CopyKpiTemplateModal
          templates={[template]}
          onClose={() => setCopyOpen(false)}
          onCopied={([copy], targetChangePercent) => {
            if (copy) {
              void openCopy(copy.id, template.name, targetChangePercent);
            }
          }}
        />
      ) : null}
    </AppShell>
  );
}
