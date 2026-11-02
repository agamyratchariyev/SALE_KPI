import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  bulkDeleteKpiTemplates,
  bulkSetKpiTemplatesActive,
  listKpiTemplates,
  type KpiTemplateListQuery,
} from '../api/kpi-templates';
import { AppShell } from '../components/AppShell';
import { BulkActionBar, type BulkAction } from '../components/BulkActionBar';
import { CopyKpiTemplateModal } from '../components/CopyKpiTemplateModal';
import { RecordInfoButton } from '../components/RecordInfo';
import { SelectCheckbox } from '../components/SelectCheckbox';
import { StatusBadge } from '../components/StatusBadge';
import { describeTargetChange } from '../components/TargetChange';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import { isBulkBarVisible, type BulkNotice } from '../lib/bulk';
import { useSelection } from '../lib/use-selection';
import type { KpiTemplateSummary } from '../types/api';
import { confirmAction } from '../store/confirm-store';

type StatusFilter = 'all' | 'active' | 'inactive';
type BulkTemplateAction = 'activate' | 'deactivate' | 'delete';

/** `KPI_TEMPLATE_IN_USE` names the templates a KPI plan was built from (ADR-040). */
function describeBulkError(error: unknown, t: Translate): string {
  if (error instanceof ApiError && error.body?.code === 'KPI_TEMPLATE_IN_USE') {
    return t('kpiTemplates.bulkDeleteInUse', {
      names: (error.body.templates ?? []).map((template) => template.name).join(', '),
    });
  }

  return localizeApiError(error, t, 'kpiTemplates.bulkError');
}

function TemplateStatus({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();

  return (
    <StatusBadge
      isActive={isActive}
      label={t(isActive ? 'kpiTemplates.activeBadge' : 'kpiTemplates.inactiveBadge')}
    />
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 flex-shrink-0"
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlansIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 flex-shrink-0"
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" />
    </svg>
  );
}

/**
 * How many KPI plans were built from the template. The count opens the KPI plans of the
 * newest month that used it, filtered to this template; an unused template says so.
 */
function TemplateUsage({ template }: { template: KpiTemplateSummary }) {
  const { t, locale } = useTranslation();

  if (template.planCount === 0 || template.lastPeriod === null) {
    return (
      <span className="flex-shrink-0 px-1 text-[11px] text-slate-400 dark:text-slate-500">
        {t('kpiTemplates.unused')}
      </span>
    );
  }

  const count = formatNumber(template.planCount, locale);
  const params = new URLSearchParams({ period: template.lastPeriod, template: template.id });

  return (
    <Link
      to={`/kpi-plans?${params.toString()}`}
      aria-label={t('kpiTemplates.openPlans', { name: template.name, count })}
      title={t('kpiTemplates.openPlans', { name: template.name, count })}
      className="flex min-h-[44px] flex-shrink-0 items-center"
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300">
        <PlansIcon />
        {t('kpiTemplates.planCount', { count })}
      </span>
    </Link>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: KpiTemplateSummary;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const { t, locale } = useTranslation();

  return (
    <div
      className={`flex min-h-[64px] items-center overflow-hidden rounded-xl border transition ${
        selected
          ? 'border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <SelectCheckbox
        checked={selected}
        onChange={onSelect}
        label={t('common.selectItem', { name: template.name })}
      />
      <Link
        to={`/kpi-templates/${template.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 pr-4 transition active:bg-slate-100 dark:active:bg-slate-800"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {template.name}
            </span>
            <TemplateStatus isActive={template.isActive} />
          </span>
          {template.description ? (
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              {template.description}
            </span>
          ) : null}
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {t('kpiTemplates.kpiCount', { count: formatNumber(template.itemCount, locale) })}
            {' · '}
            {t('kpiTemplates.weightSummary', { total: formatNumber(template.totalWeight, locale) })}
          </span>
        </span>
        <span className="text-slate-400">
          <ChevronIcon />
        </span>
      </Link>
      {/* Its own link: a link inside the card's link would not be valid HTML. */}
      <TemplateUsage template={template} />
      <RecordInfoButton tableName="kpi_templates" recordId={template.id} title={template.name} />
    </div>
  );
}

export function KpiTemplatesPage() {
  const { t, locale } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [notice, setNotice] = useState<BulkNotice | null>(null);
  // Copying asks how much the default targets change first (ADR-070).
  const [copyTargets, setCopyTargets] = useState<KpiTemplateSummary[] | null>(null);
  const queryClient = useQueryClient();

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query: KpiTemplateListQuery = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(status === 'all' ? {} : { isActive: status === 'active' }),
    }),
    [search, status],
  );

  const templatesQuery = useInfiniteQuery({
    queryKey: ['kpi-templates', 'list', query],
    queryFn: ({ pageParam }) => listKpiTemplates(pageParam, query),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
  });

  const templates = useMemo(
    () => templatesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [templatesQuery.data],
  );
  const total = templatesQuery.data?.pages[0]?.total ?? 0;

  // Bulk selection (ADR-035): scoped to the query and limited to loaded rows.
  const selection = useSelection(JSON.stringify(query));
  const selectedTemplates = templates.filter((template) => selection.selected.has(template.id));
  const allSelected = templates.length > 0 && selectedTemplates.length === templates.length;
  const dismissNotice = useCallback(() => setNotice(null), []);

  const bulkMutation = useMutation({
    mutationFn: async ({
      ids,
      action,
    }: {
      ids: string[];
      action: BulkTemplateAction;
    }): Promise<number> => {
      if (action === 'delete') {
        return (await bulkDeleteKpiTemplates(ids)).deleted;
      }

      return (await bulkSetKpiTemplatesActive(ids, action === 'activate')).updated;
    },
    onMutate: () => setNotice(null),
    onSuccess: (count, { action }) => {
      selection.clear();
      const key =
        action === 'activate'
          ? 'kpiTemplates.bulkActivated'
          : action === 'delete'
            ? 'kpiTemplates.bulkDeleted'
            : 'kpiTemplates.bulkDeactivated';
      setNotice({ tone: 'success', text: t(key, { count: formatNumber(count, locale) }) });
    },
    onError: (error) => setNotice({ tone: 'error', text: describeBulkError(error, t) }),
    // Earlier chunks may have been applied even on error, so always refetch.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kpi-templates'] }),
  });

  async function runBulk(action: BulkTemplateAction, targets: KpiTemplateSummary[]) {
    const count = formatNumber(targets.length, locale);

    if (
      action === 'deactivate' &&
      !(await confirmAction({
        message: t('kpiTemplates.bulkDeactivateConfirm', { count }),
        tone: 'danger',
      }))
    ) {
      return;
    }

    if (
      action === 'delete' &&
      !(await confirmAction({
        message: t('kpiTemplates.bulkDeleteConfirm', { count }),
        tone: 'danger',
      }))
    ) {
      return;
    }

    bulkMutation.mutate({ action, ids: targets.map((template) => template.id) });
  }

  function handleCopied(count: number, targetChangePercent: number) {
    setCopyTargets(null);
    selection.clear();
    const copied = t('kpiTemplates.bulkCopied', { count: formatNumber(count, locale) });
    const change = describeTargetChange(targetChangePercent, t, locale);
    setNotice({ tone: 'success', text: change ? `${copied} ${change}` : copied });
    void queryClient.invalidateQueries({ queryKey: ['kpi-templates'] });
  }

  // Status actions are offered only when they change something; a mixed selection shows
  // per-action counts. Copy works for active and inactive templates alike.
  const toActivate = selectedTemplates.filter((template) => !template.isActive);
  const toDeactivate = selectedTemplates.filter((template) => template.isActive);
  const withCount = (label: string, count: number) =>
    count === selectedTemplates.length ? label : `${label} (${formatNumber(count, locale)})`;
  const bulkActions: BulkAction[] = [
    {
      key: 'copy',
      label: t('kpiTemplates.bulkCopy'),
      tone: 'neutral',
      onClick: () => {
        setNotice(null);
        setCopyTargets(selectedTemplates);
      },
    },
    ...(toActivate.length > 0
      ? [
          {
            key: 'activate',
            label: withCount(t('kpiTemplates.bulkActivate'), toActivate.length),
            tone: 'primary' as const,
            onClick: () => void runBulk('activate', toActivate),
          },
        ]
      : []),
    ...(toDeactivate.length > 0
      ? [
          {
            key: 'deactivate',
            label: withCount(t('kpiTemplates.bulkDeactivate'), toDeactivate.length),
            tone: 'neutral' as const,
            onClick: () => void runBulk('deactivate', toDeactivate),
          },
        ]
      : []),
    {
      key: 'delete',
      label: t('kpiTemplates.bulkDelete'),
      tone: 'danger',
      onClick: () => void runBulk('delete', selectedTemplates),
    },
  ];
  const bulkBarVisible = isBulkBarVisible(selectedTemplates.length, notice);

  const selectAllProps = {
    checked: allSelected,
    indeterminate: selectedTemplates.length > 0 && !allSelected,
    label: t('common.selectAll'),
    onChange: (checked: boolean) =>
      selection.setMany(
        templates.map((template) => template.id),
        checked,
      ),
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        templatesQuery.hasNextPage &&
        !templatesQuery.isFetchingNextPage
      ) {
        void templatesQuery.fetchNextPage();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [templatesQuery]);

  const isFiltered = Boolean(search) || status !== 'all';
  const hasNoResults = !templatesQuery.isLoading && templates.length === 0;

  return (
    <AppShell
      title={t('kpiTemplates.title')}
      fullWidth
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('kpiTemplates.title') },
      ]}
    >
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('kpiTemplates.searchPlaceholder')}
            aria-label={t('kpiTemplates.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label={t('kpiTemplates.statusLabel')}
          className="ml-auto h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="all">{t('kpiTemplates.statusAll')}</option>
          <option value="active">{t('kpiTemplates.statusActive')}</option>
          <option value="inactive">{t('kpiTemplates.statusInactive')}</option>
        </select>
      </div>

      {isFiltered && !templatesQuery.isLoading ? (
        <p className="px-4 pb-3 text-xs text-slate-500 dark:text-slate-400">
          {t('kpiTemplates.resultCount', { count: formatNumber(total, locale) })}
        </p>
      ) : null}

      {templatesQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('kpiTemplates.loading')}
        </p>
      ) : null}

      {templatesQuery.isError ? (
        <p
          role="alert"
          className="mx-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {t('kpiTemplates.errorLoading')}
        </p>
      ) : null}

      {hasNoResults && !templatesQuery.isError ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {isFiltered ? t('kpiTemplates.noSearchResults') : t('kpiTemplates.empty')}
        </p>
      ) : null}

      {templates.length > 0 ? (
        <>
          <div className="px-2 pb-1 lg:hidden">
            <SelectCheckbox {...selectAllProps} showLabel />
          </div>

          <div className={`flex flex-col gap-2 px-4 lg:hidden ${bulkBarVisible ? '' : 'pb-24'}`}>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selection.selected.has(template.id)}
                onSelect={(checked) => selection.toggle(template.id, checked)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                  <th className="w-12 py-0 pl-2 font-medium">
                    <SelectCheckbox {...selectAllProps} />
                  </th>
                  <th className="py-2 pr-3 font-medium">{t('kpiTemplates.columnName')}</th>
                  <th className="py-2 pr-3 font-medium">{t('kpiTemplates.columnDescription')}</th>
                  <th className="py-2 pr-3 text-right font-medium">
                    {t('kpiTemplates.columnKpis')}
                  </th>
                  <th className="py-2 pr-3 text-right font-medium">
                    {t('kpiTemplates.columnWeight')}
                  </th>
                  <th className="py-2 pr-3 font-medium">{t('kpiTemplates.columnPlans')}</th>
                  <th className="py-2 pr-3 font-medium">{t('kpiTemplates.columnStatus')}</th>
                  <th className="py-2 pr-4 text-right font-medium">
                    {t('kpiTemplates.columnActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className={`border-b border-slate-100 transition last:border-0 dark:border-slate-800/70 ${
                      selection.selected.has(template.id)
                        ? 'bg-emerald-50 dark:bg-emerald-400/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <td className="w-12 py-0 pl-2">
                      <SelectCheckbox
                        checked={selection.selected.has(template.id)}
                        onChange={(checked) => selection.toggle(template.id, checked)}
                        label={t('common.selectItem', { name: template.name })}
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link
                        to={`/kpi-templates/${template.id}`}
                        className="text-sm font-medium text-slate-900 dark:text-slate-100"
                      >
                        {template.name}
                      </Link>
                    </td>
                    <td className="max-w-md py-2.5 pr-3">
                      <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
                        {template.description ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      {formatNumber(template.itemCount, locale)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      {formatNumber(template.totalWeight, locale)}%
                    </td>
                    <td className="py-0 pr-3">
                      <TemplateUsage template={template} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <TemplateStatus isActive={template.isActive} />
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/kpi-templates/${template.id}`}
                          aria-label={t('kpiTemplates.editTemplate', { name: template.name })}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
                        >
                          <ChevronIcon />
                        </Link>
                        <RecordInfoButton
                          tableName="kpi_templates"
                          recordId={template.id}
                          title={template.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div ref={sentinelRef} className="h-1" />

      {templatesQuery.isFetchingNextPage ? (
        <p className="py-4 text-center text-xs text-slate-500">{t('kpiTemplates.loading')}</p>
      ) : null}

      {/* Keeps the last rows scrollable above the fixed bulk bar. */}
      {bulkBarVisible ? <div aria-hidden="true" className="h-44 sm:h-32" /> : null}

      <BulkActionBar
        count={selectedTemplates.length}
        actions={bulkActions}
        onClear={selection.clear}
        pendingKey={bulkMutation.isPending ? bulkMutation.variables.action : null}
        notice={notice}
        onDismissNotice={dismissNotice}
      />

      {copyTargets ? (
        <CopyKpiTemplateModal
          templates={copyTargets}
          onClose={() => setCopyTargets(null)}
          onCopied={(copies, targetChangePercent) =>
            handleCopied(copies.length, targetChangePercent)
          }
        />
      ) : null}

      {!bulkBarVisible ? (
        <Link
          to="/kpi-templates/new"
          aria-label={t('kpiTemplates.add')}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 active:scale-95"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </Link>
      ) : null}
    </AppShell>
  );
}
