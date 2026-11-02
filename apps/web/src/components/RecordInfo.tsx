import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { getRecordInfo, listRecordHistory } from '../api/audit';
import { localizeApiError } from '../i18n/api-errors';
import { formatDateTime, formatNumber } from '../i18n/formatters';
import { pickLocalizedText } from '../i18n/localized-text';
import { useTranslation, type Translate, type TranslationKey } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import { mergeRequestEntries } from '../lib/record-history';
import { useAuthStore } from '../store/auth-store';
import { useRecordInfoStore, type RecordInfoTarget } from '../store/record-info-store';
import type {
  AuditActor,
  AuditedTable,
  AuditFieldChange,
  AuditLogEntry,
  LocalizedText,
} from '../types/api';
import { Drawer } from './Drawer';
import { Spinner } from './Spinner';
import { describeTargetChange } from './TargetChange';

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function actorName(actor: AuditActor | null, t: Translate): string {
  return actor ? `${actor.firstname} ${actor.lastname}` : t('recordInfo.system');
}

function InfoIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The single entry point to record info (ADR-036): the same ⓘ button at the right end of a
 * record's row or title line on every screen. Renders nothing for users without
 * full_access, whom the API would refuse anyway.
 */
export function RecordInfoButton(target: RecordInfoTarget) {
  const { t } = useTranslation();
  const canView = useAuthStore((state) => state.employee?.fullAccess ?? false);
  const open = useRecordInfoStore((state) => state.open);

  if (!canView) {
    return null;
  }

  const label = t('recordInfo.buttonFor', { name: target.title });

  return (
    <button
      type="button"
      onClick={(event) => {
        // Rows are often links; the button must not navigate.
        event.preventDefault();
        event.stopPropagation();
        open({ tableName: target.tableName, recordId: target.recordId, title: target.title });
      }}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
    >
      <InfoIcon className="h-5 w-5" />
    </button>
  );
}

/** Mounted once next to the routes; closes the panel when the user navigates away. */
export function RecordInfoHost() {
  const target = useRecordInfoStore((state) => state.target);
  const close = useRecordInfoStore((state) => state.close);
  const { pathname } = useLocation();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return <RecordInfoPanel target={target} onClose={close} />;
}

/** Right-hand panel: who created and last changed the record, then its change history. */
function RecordInfoPanel({
  target,
  onClose,
}: {
  target: RecordInfoTarget | null;
  /** Must be stable (useCallback); Escape calls it. */
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const open = target !== null;
  // Keep showing the last record while the panel slides out.
  const [shown, setShown] = useState(target);

  if (target && target !== shown) {
    setShown(target);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      variant="overlay"
      as="aside"
      label={t('recordInfo.title')}
      closeLabel={t('common.close')}
      panelClassName="w-[92vw] max-w-md"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('recordInfo.title')}
          </h2>
          {shown ? (
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{shown.title}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {shown ? (
        <RecordInfoBody key={`${shown.tableName}:${shown.recordId}`} target={shown} active={open} />
      ) : null}
    </Drawer>
  );
}

function RecordInfoBody({ target, active }: { target: RecordInfoTarget; active: boolean }) {
  const { t, locale } = useTranslation();
  // Always fetched fresh when the panel opens; the record may have changed meanwhile.
  const infoQuery = useQuery({
    queryKey: ['record-info', target.tableName, target.recordId],
    queryFn: () => getRecordInfo(target.tableName, target.recordId),
    enabled: active,
    refetchOnMount: 'always',
  });
  const historyQuery = useInfiniteQuery({
    queryKey: ['audit-logs', target.tableName, target.recordId],
    queryFn: ({ pageParam }) => listRecordHistory(target.tableName, target.recordId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
    enabled: active,
    refetchOnMount: 'always',
  });
  const entries = useMemo(
    () => mergeRequestEntries(historyQuery.data?.pages.flatMap((page) => page.items) ?? []),
    [historyQuery.data],
  );
  const info = infoQuery.data;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {infoQuery.isError ? (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {localizeApiError(infoQuery.error, t, 'recordInfo.error')}
        </p>
      ) : info ? (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              ['recordInfo.createdBy', info.createdBy, info.createdAt],
              ['recordInfo.updatedBy', info.updatedBy, info.updatedAt],
            ] as const
          ).map(([labelKey, actor, date]) => (
            <div key={labelKey} className="contents">
              <dt className="text-slate-500 dark:text-slate-400">{t(labelKey)}</dt>
              <dd className="min-w-0">
                <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                  {actorName(actor, t)}
                  {actor ? (
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {' '}
                      @{actor.username}
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(date, locale)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <LoadingLine />
      )}

      <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {t('recordInfo.history')}
      </h3>

      {historyQuery.isError ? (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {localizeApiError(historyQuery.error, t, 'recordInfo.error')}
        </p>
      ) : historyQuery.isLoading ? (
        <LoadingLine />
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('recordInfo.historyEmpty')}</p>
      ) : (
        <ol className="ml-1">
          {entries.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} tableName={target.tableName} />
          ))}
        </ol>
      )}

      {historyQuery.hasNextPage ? (
        <button
          type="button"
          disabled={historyQuery.isFetchingNextPage}
          onClick={() => void historyQuery.fetchNextPage()}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          {historyQuery.isFetchingNextPage ? <Spinner /> : null}
          {t('recordInfo.loadMore')}
        </button>
      ) : null}

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        {t('recordInfo.historyHint')}
      </p>
    </div>
  );
}

function LoadingLine() {
  const { t } = useTranslation();

  return (
    <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <Spinner />
      {t('recordInfo.loading')}
    </p>
  );
}

const ACTION_DOTS: Record<AuditLogEntry['action'], string> = {
  create: 'bg-emerald-500',
  update: 'bg-sky-500',
  delete: 'bg-red-500',
  export: 'bg-violet-500',
};

/** "Deactivated" reads better than "Updated · Status: Active → Inactive". */
function statusOnlyChange(entry: AuditLogEntry): boolean | null {
  const fields = Object.keys(entry.changes);
  const next = entry.changes.isActive?.new;

  return entry.action === 'update' && fields.length === 1 && typeof next === 'boolean'
    ? next
    : null;
}

function actionLabel(entry: AuditLogEntry, t: Translate): string {
  const status = statusOnlyChange(entry);

  if (status !== null) {
    return t(status ? 'recordInfo.actionActivate' : 'recordInfo.actionDeactivate');
  }

  return t(
    entry.action === 'create'
      ? 'recordInfo.actionCreate'
      : entry.action === 'delete'
        ? 'recordInfo.actionDelete'
        : entry.action === 'export'
          ? 'recordInfo.actionExport'
          : 'recordInfo.actionUpdate',
  );
}

function viaLabel(context: AuditLogEntry['context'], t: Translate): string | null {
  switch (context?.via) {
    case 'bulk-status':
      return t('recordInfo.viaBulkStatus');
    case 'bulk-copy':
      return t('recordInfo.viaBulkCopy');
    case 'excel-import':
      return t('recordInfo.viaExcelImport');
    default:
      return null;
  }
}

/** The downloaded file of an export entry (ADR-059). */
function exportedFileName(context: AuditLogEntry['context']): string | null {
  return context?.via === 'excel-export' && typeof context.fileName === 'string'
    ? context.fileName
    : null;
}

function copiedFromName(context: AuditLogEntry['context']): string | null {
  const source = context?.copiedFrom;

  return source && typeof source === 'object' && 'name' in source && typeof source.name === 'string'
    ? source.name
    : null;
}

/** A copy that changed its targets by a percentage says by how much (ADR-070). */
function targetChangeOf(context: AuditLogEntry['context']): number {
  const percent = context?.targetChangePercent;

  return typeof percent === 'number' ? percent : 0;
}

function HistoryItem({ entry, tableName }: { entry: AuditLogEntry; tableName: AuditedTable }) {
  const { t, locale } = useTranslation();
  const via = viaLabel(entry.context, t);
  const copiedFrom = copiedFromName(entry.context);
  const targetChange = describeTargetChange(targetChangeOf(entry.context), t, locale);
  const exportedFile = exportedFileName(entry.context);
  const fields = statusOnlyChange(entry) === null ? Object.entries(entry.changes) : [];

  return (
    <li className="relative border-l-2 border-slate-200 pb-5 pl-4 last:pb-0 dark:border-slate-800">
      <span
        aria-hidden="true"
        className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${ACTION_DOTS[entry.action]}`}
      />
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {actionLabel(entry, t)}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {actorName(entry.actor, t)} · {formatDateTime(entry.createdAt, locale)}
        {via ? ` · ${via}` : ''}
      </p>
      {copiedFrom ? (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {t('recordInfo.copiedFrom', { name: copiedFrom })}
        </p>
      ) : null}
      {targetChange ? (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{targetChange}</p>
      ) : null}
      {exportedFile ? (
        <p className="mt-1 break-all text-xs text-slate-600 dark:text-slate-300">
          {t('recordInfo.exportedFile', { name: exportedFile })}
        </p>
      ) : null}
      {fields.length > 0 ? (
        <dl className="mt-2 space-y-1.5">
          {fields.map(([field, change]) => (
            <div key={field}>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {fieldLabel(tableName, field, t)}
              </dt>
              <dd className="break-words text-sm text-slate-800 dark:text-slate-200">
                <ChangeValue field={field} change={change} action={entry.action} locale={locale} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

function fieldLabel(tableName: AuditedTable, field: string, t: Translate): string {
  const key = `recordInfo.fields.${tableName}.${field}` as TranslationKey;
  const label = t(key);

  // Unknown fields (a column added later) fall back to their API name.
  return label === key ? field : label;
}

/** Foreign keys (avatarId, erpEmployeeId …) mean nothing to people; show what happened. */
function isReferenceField(field: string): boolean {
  return field.endsWith('Id');
}

function ChangeValue({
  field,
  change,
  action,
  locale,
}: {
  field: string;
  change: AuditFieldChange;
  action: AuditLogEntry['action'];
  locale: Locale;
}) {
  const { t } = useTranslation();

  if (change.redacted) {
    return <>{t('recordInfo.valueChanged')}</>;
  }

  if (field === 'items') {
    return <ItemsChange change={change} locale={locale} />;
  }

  const hadValue = change.old !== undefined && change.old !== null;
  const hasValue = change.new !== undefined && change.new !== null;

  if (isReferenceField(field)) {
    const key: TranslationKey =
      action === 'create' || (!hadValue && hasValue)
        ? 'recordInfo.valueAdded'
        : action === 'delete' || (hadValue && !hasValue)
          ? 'recordInfo.valueRemoved'
          : 'recordInfo.valueChanged';
    return <>{t(key)}</>;
  }

  if (!('old' in change)) {
    return <>{formatValue(field, change.new, t, locale)}</>;
  }

  if (!('new' in change)) {
    return <>{formatValue(field, change.old, t, locale)}</>;
  }

  return (
    <>
      <span className="text-slate-500 dark:text-slate-400">
        {formatValue(field, change.old, t, locale)}
      </span>
      <span aria-hidden="true" className="px-1.5 text-slate-400">
        →
      </span>
      <span className="font-medium">{formatValue(field, change.new, t, locale)}</span>
    </>
  );
}

function formatValue(field: string, value: unknown, t: Translate, locale: Locale): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    if (field === 'isActive') {
      return t(value ? 'recordInfo.valueActive' : 'recordInfo.valueInactive');
    }

    return t(value ? 'recordInfo.valueYes' : 'recordInfo.valueNo');
  }

  if (typeof value === 'number') {
    return formatNumber(value, locale);
  }

  if (typeof value === 'string') {
    return ISO_DATE_TIME.test(value) ? formatDateTime(value, locale) : value;
  }

  return JSON.stringify(value);
}

interface ItemSnapshot {
  code: string;
  name: LocalizedText | null;
  weight: number;
  targetValue: number | null;
  inputValues: Record<string, unknown>;
}

function readItems(value: unknown): ItemSnapshot[] | null {
  return Array.isArray(value) ? (value as ItemSnapshot[]) : null;
}

/** KPI rows of a template, as its log entry stored them: before and after the save. */
function ItemsChange({ change, locale }: { change: AuditFieldChange; locale: Locale }) {
  const { t } = useTranslation();
  const before = readItems(change.old);
  const after = readItems(change.new);

  return (
    <div className="mt-0.5 space-y-1.5">
      {before ? (
        <ItemList
          label={after ? t('recordInfo.itemsBefore') : null}
          items={before}
          locale={locale}
          muted
        />
      ) : null}
      {after ? (
        <ItemList
          label={before ? t('recordInfo.itemsAfter') : null}
          items={after}
          locale={locale}
        />
      ) : null}
    </div>
  );
}

function ItemList({
  label,
  items,
  locale,
  muted = false,
}: {
  label: string | null;
  items: ItemSnapshot[];
  locale: Locale;
  muted?: boolean;
}): ReactNode {
  const { t } = useTranslation();

  return (
    <div className={muted ? 'text-slate-500 dark:text-slate-400' : ''}>
      {label ? <p className="text-xs font-medium">{label}</p> : null}
      <ul className="list-inside list-disc text-sm">
        {items.map((item, index) => {
          const inputs = Object.values(item.inputValues ?? {})
            .map((value) => (Array.isArray(value) ? value.join(', ') : String(value)))
            .join('; ');

          return (
            <li key={`${item.code}-${index}`}>
              {item.name ? pickLocalizedText(item.name, locale) : item.code}
              {' · %'}
              {formatNumber(item.weight, locale)}
              {item.targetValue !== null
                ? ` · ${t('recordInfo.target', { value: formatNumber(item.targetValue, locale) })}`
                : ''}
              {inputs ? ` (${inputs})` : ''}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
