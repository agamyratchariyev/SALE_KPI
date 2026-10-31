import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { listEmployees } from '../api/employees';
import {
  assignKpiTemplate,
  calculateKpiPeriod,
  closeKpiPeriod,
  copyKpiPlans,
  deleteKpiPlan,
  ensureKpiPeriod,
  exportKpiPeriod,
  listKpiPeriods,
  listKpiPlans,
  reopenKpiPeriod,
} from '../api/kpi-plans';
import { getKpiTemplate, listKpiTemplates } from '../api/kpi-templates';
import { AppShell } from '../components/AppShell';
import { PasswordConfirmModal } from '../components/PasswordConfirmModal';
import { Drawer } from '../components/Drawer';
import { EmployeeAvatarButton } from '../components/EmployeeAvatarButton';
import { EmployeeCardModal } from '../components/EmployeeCardModal';
import { FormField, formInputClassName } from '../components/FormField';
import {
  RevealToggle,
  SalaryRevealProvider,
  SalarySplitBar,
  SecretAmount,
} from '../components/KpiSalary';
import { PersonAvatar } from '../components/ProfileAvatar';
import { ProgressMeter } from '../components/ProgressMeter';
import { RecordInfoButton } from '../components/RecordInfo';
import { SelectCheckbox } from '../components/SelectCheckbox';
import { localizeApiError } from '../i18n/api-errors';
import { formatDate, formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate, type TranslationKey } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import { ApiError } from '../lib/api-client';
import { saveFile } from '../lib/save-file';
import type {
  EmployeeResponse,
  KpiPeriod,
  KpiPlanSalary,
  KpiPlanSalarySummary,
  KpiPlanSkipReason,
  KpiPlanSummary,
} from '../types/api';
import { confirmAction } from '../store/confirm-store';

/** Any GUID text; SQL Server's NEWSEQUENTIALID values are not RFC 4122 UUIDs. */
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Notice = { tone: 'success' | 'error'; text: string } | null;

function employeeName(employee: { firstname: string; lastname: string }): string {
  return `${employee.firstname} ${employee.lastname}`.trim();
}

/** Today in UTC: the calendar the reopen rule is written in (ADR-044). */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function skipReason(reason: KpiPlanSkipReason, t: Translate): string {
  switch (reason) {
    case 'already-assigned':
      return t('kpiPlans.reasonAlreadyAssigned');
    case 'inactive':
      return t('kpiPlans.reasonInactive');
    default:
      return t('kpiPlans.reasonMissingErpLink');
  }
}

/** Turns the API's business error `code` (ADR-039) into a message in the chosen language. */
function describeAssignError(error: unknown, t: Translate, employees: EmployeeResponse[]): string {
  if (error instanceof ApiError && error.body?.code) {
    const body = error.body as {
      code?: string;
      employeeIds?: string[];
      employees?: { employeeId: string; reason: KpiPlanSkipReason }[];
    };
    const nameOf = (id: string) =>
      employees.find((employee) => employee.id.toLowerCase() === id.toLowerCase())?.username ?? id;

    switch (body.code) {
      case 'KPI_ASSIGNMENT_EXISTS':
        return t('kpiPlans.alreadyAssigned', {
          names: (body.employeeIds ?? []).map(nameOf).join(', '),
        });
      case 'KPI_ASSIGNMENT_INELIGIBLE':
        return t('kpiPlans.ineligible', {
          names: (body.employees ?? [])
            .map((entry) => `${nameOf(entry.employeeId)} (${skipReason(entry.reason, t)})`)
            .join(', '),
        });
      case 'KPI_PERIOD_CLOSED':
        return t('kpiPlans.periodClosedError');
    }
  }

  return localizeApiError(error, t, 'kpiPlans.assignError');
}

/** Errors of the period actions and of deleting a plan (ADR-039, ADR-044). */
function describePeriodError(error: unknown, t: Translate, locale: Locale): string {
  if (error instanceof ApiError && error.body?.code) {
    const body = error.body as { code?: string; reopenableUntil?: string };

    switch (body.code) {
      case 'KPI_PERIOD_CLOSED':
        return t('kpiPlans.periodClosedError');
      case 'KPI_PERIOD_REOPEN_EXPIRED':
        return t('kpiPlans.reopenExpired', {
          date: body.reopenableUntil ? formatDate(body.reopenableUntil, locale) : '—',
        });
    }
  }

  return localizeApiError(error, t);
}

function PlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon({ className = 'h-5 w-5' }: { className?: string }) {
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
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 44 px delete button of one plan row; rendered only while the period is open. */
function DeletePlanButton({
  name,
  onDelete,
  disabled,
}: {
  name: string;
  onDelete: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const label = t('kpiPlans.deletePlan', { name });

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
    >
      <TrashIcon />
    </button>
  );
}

/** A plan's score on its 0–100 bar with the number beside it (ADR-041). */
function PlanScoreMeter({
  score,
  name,
  compact = false,
  className = '',
}: {
  score: number;
  name: string;
  /** Number only, for the table whose column header already says "score". */
  compact?: boolean;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const value = formatNumber(score, locale);
  const text = compact ? value : t('kpiPlans.scoreValue', { value });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ProgressMeter
        size="sm"
        value={score}
        label={t('kpiProgress.scoreMeterLabel', { name })}
        valueText={t('kpiPlans.scoreValue', { value })}
        className="flex-1"
      />
      <span
        className={`flex-shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100 ${
          compact ? 'w-12 text-sm' : 'w-20 text-xs'
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  onDelete,
  onOpenCard,
  deleting,
}: {
  plan: KpiPlanSummary;
  /** Absent when the period is closed. */
  onDelete: (() => void) | undefined;
  onOpenCard: () => void;
  deleting: boolean;
}) {
  const { t, locale } = useTranslation();
  const name = employeeName(plan.employee);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-h-[64px] items-center">
        <div className="self-start pl-2 pt-2.5">
          <EmployeeAvatarButton
            person={plan.employee}
            avatarPath={plan.employee.avatarUrl}
            onOpenCard={onOpenCard}
          />
        </div>
        <Link
          to={`/kpi-plans/${plan.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 pl-2 pr-2 transition active:bg-slate-100 dark:active:bg-slate-800"
        >
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {name}
            </span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              {plan.employee.jobTitle ? `${plan.employee.jobTitle} · ` : ''}
              {plan.templateName}
            </span>
            {plan.totalScore === null ? null : (
              <PlanScoreMeter score={plan.totalScore} name={name} className="mt-2" />
            )}
            <span
              className={`mt-1 block text-xs ${
                plan.targetCount < plan.itemCount
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t('kpiPlans.targetProgress', {
                done: formatNumber(plan.targetCount, locale),
                total: formatNumber(plan.itemCount, locale),
              })}
            </span>
          </div>
        </Link>
        {onDelete ? <DeletePlanButton name={name} onDelete={onDelete} disabled={deleting} /> : null}
        <RecordInfoButton tableName="kpi_assignments" recordId={plan.id} title={name} />
      </div>
      <PlanSalaryStrip salary={plan.salary} />
    </div>
  );
}

/**
 * One plan's pay under its card (ADR-067): the fixed part, what the score earned of the KPI
 * part and what the period pays. The currency is written once, on the payable figure.
 */
function PlanSalaryStrip({ salary }: { salary: KpiPlanSalary | null }) {
  const { t } = useTranslation();

  if (!salary) {
    return (
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        {t('kpiPlans.noSalary')}
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="min-w-0">
        <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {t('kpiPlans.salaryFixed')}
        </dt>
        <dd>
          <SecretAmount
            value={salary.fixedAmount}
            currency={salary.currency}
            showCurrency={false}
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          />
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {t('kpiPlans.salaryKpi')}
        </dt>
        <dd>
          {salary.kpiEarned === null ? (
            <span className="text-sm text-slate-400">—</span>
          ) : (
            <SecretAmount
              value={salary.kpiEarned}
              currency={salary.currency}
              showCurrency={false}
              className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
            />
          )}
        </dd>
      </div>
      <div className="min-w-0 text-right">
        <dt className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {t('kpiPlans.salaryPayable')}
        </dt>
        <dd>
          <SecretAmount
            value={salary.totalEarned ?? salary.fixedAmount}
            currency={salary.currency}
            className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100"
          />
        </dd>
      </div>
    </dl>
  );
}

/** The table's pay cell: what the period pays, with the fixed and KPI parts under it. */
function PlanSalaryCell({ salary }: { salary: KpiPlanSalary | null }) {
  const { t } = useTranslation();

  if (!salary) {
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">{t('kpiPlans.noSalary')}</span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <SecretAmount
        value={salary.totalEarned ?? salary.fixedAmount}
        currency={salary.currency}
        className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100"
      />
      {/* One line from xl; below it the breakdown may wrap so the table fits at 1024 px. */}
      <span className="text-right text-[11px] text-slate-500 xl:whitespace-nowrap dark:text-slate-400">
        {t('kpiPlans.salaryFixed')}{' '}
        <SecretAmount value={salary.fixedAmount} currency={salary.currency} showCurrency={false} />
        {' · '}
        {t('kpiPlans.salaryKpi')}{' '}
        {salary.kpiEarned === null ? (
          '—'
        ) : (
          <SecretAmount
            value={salary.kpiEarned}
            currency={salary.currency}
            showCurrency={false}
            className="text-emerald-700 dark:text-emerald-400"
          />
        )}
      </span>
    </div>
  );
}

/**
 * What the listed plans pay altogether, next to the search (ADR-067). It covers every plan
 * the search and template filter keep, not only the loaded rows, and each currency apart.
 */
function PlanSalarySummary({
  summary,
  periodOpen,
  className = '',
}: {
  summary: KpiPlanSalarySummary;
  periodOpen: boolean;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const hasTotals = summary.totals.length > 0;
  const percentOf = (value: number, of: number) =>
    formatNumber(of > 0 ? Math.round((value / of) * 1000) / 10 : 0, locale);
  const notes = [
    summary.withoutSalaryCount > 0 && hasTotals
      ? t('kpiPlans.salaryWithout', { count: formatNumber(summary.withoutSalaryCount, locale) })
      : null,
    summary.notCalculatedCount > 0
      ? t('kpiPlans.salaryNotCalculated', {
          count: formatNumber(summary.notCalculatedCount, locale),
        })
      : null,
    hasTotals ? t(periodOpen ? 'kpiSalary.interim' : 'kpiSalary.final') : null,
  ].filter((note) => note !== null);

  return (
    <section
      aria-label={t('kpiPlans.salaryTitle')}
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('kpiPlans.salaryTitle')}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t('kpiPlans.salaryPlans', { count: formatNumber(summary.planCount, locale) })}
          </p>
        </div>
        {hasTotals ? <RevealToggle /> : null}
      </div>

      {hasTotals ? (
        summary.totals.map((total) => (
          <div key={total.currency} className="mt-2">
            <div className="min-h-[36px]">
              <SecretAmount
                value={total.totalEarned}
                currency={total.currency}
                className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
              />
            </div>
            <SalarySplitBar
              amount={total.amount}
              fixedAmount={total.fixedAmount}
              earned={total.kpiEarned}
              label={t('kpiPlans.salaryBarLabel', {
                fixed: percentOf(total.fixedAmount, total.amount),
                earned: percentOf(total.kpiEarned, total.amount),
              })}
              className="mt-2"
            />
            <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-500"
                />
                <dt className="text-slate-500 dark:text-slate-400">{t('kpiPlans.salaryFixed')}</dt>
                <dd>
                  <SecretAmount
                    value={total.fixedAmount}
                    currency={total.currency}
                    className="font-semibold text-slate-800 dark:text-slate-100"
                  />
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                />
                <dt className="text-slate-500 dark:text-slate-400">{t('kpiPlans.salaryKpi')}</dt>
                <dd className="flex items-baseline gap-1">
                  <SecretAmount
                    value={total.kpiEarned}
                    currency={total.currency}
                    className="font-semibold text-emerald-700 dark:text-emerald-400"
                  />
                  <span className="text-slate-400">/</span>
                  <SecretAmount
                    value={total.kpiAmount}
                    currency={total.currency}
                    className="text-slate-500 dark:text-slate-400"
                  />
                </dd>
              </div>
            </dl>
          </div>
        ))
      ) : summary.planCount === 0 ? (
        // The search matched nothing; the card stays (desktop) so the layout does not jump.
        <p className="mt-2 text-2xl font-semibold text-slate-400 dark:text-slate-500">—</p>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('kpiPlans.salaryNone')}
        </p>
      )}

      {notes.length > 0 ? (
        <ul className="mt-3 space-y-0.5 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface PeriodPanelProps {
  periods: KpiPeriod[];
  period: KpiPeriod;
  previousPeriod: KpiPeriod | undefined;
  onSelect: (label: string) => void;
  onNewPeriod: () => void;
  onCalculate: () => void;
  onCopy: () => void;
  onClose: () => void;
  onReopen: () => void;
  onExport: () => void;
  calculating: boolean;
  copying: boolean;
  closing: boolean;
  reopening: boolean;
  exporting: boolean;
  className?: string;
}

/**
 * The selected month in one card: which month it is, whether it can still change, and the
 * actions that act on the whole month. Adding plans is the floating button of the list.
 */
function PeriodPanel({
  periods,
  period,
  previousPeriod,
  onSelect,
  onNewPeriod,
  onCalculate,
  onCopy,
  onClose,
  onReopen,
  onExport,
  calculating,
  copying,
  closing,
  reopening,
  exporting,
  className = '',
}: PeriodPanelProps) {
  const { t, locale } = useTranslation();
  const isOpen = period.status === 'open';
  const statusHint = isOpen
    ? t('kpiPlans.periodOpenHint')
    : period.canReopen
      ? t('kpiPlans.periodClosedReopenable', { date: formatDate(period.reopenableUntil, locale) })
      : t('kpiPlans.periodClosedFinal');

  return (
    <section
      aria-label={t('kpiPlans.periodLabel')}
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center gap-2">
        <select
          value={period.label}
          onChange={(event) => onSelect(event.target.value)}
          aria-label={t('kpiPlans.periodLabel')}
          className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 sm:max-w-48 sm:flex-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {periods.map((item) => (
            <option key={item.id} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onNewPeriod}
          className="inline-flex h-11 flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" />
          {t('kpiPlans.newPeriod')}
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
            isOpen ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
          }`}
        />
        <p className="min-w-0 text-sm">
          <span className="block font-semibold text-slate-900 dark:text-slate-100">
            {t(isOpen ? 'kpiPlans.statusOpen' : 'kpiPlans.statusClosed')}
          </span>
          <span className="block text-slate-500 dark:text-slate-400">{statusHint}</span>
        </p>
      </div>

      {/* mb-auto: on desktop the card is as tall as the pay summary; the actions stay at its foot. */}
      <div className="mt-2 flex items-center justify-between gap-3 lg:mb-auto">
        <p className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
          {t('kpiPlans.periodPlans', { count: formatNumber(period.assignmentCount, locale) })}
          {period.missingTargetCount > 0 ? (
            <span className="text-amber-700 dark:text-amber-400">
              {' · '}
              {t('kpiPlans.periodMissingTargets', {
                count: formatNumber(period.missingTargetCount, locale),
              })}
            </span>
          ) : null}
        </p>
        {period.assignmentCount > 0 ? (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex h-11 flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <DownloadIcon className="h-4 w-4" />
            {exporting ? t('kpiPlans.exporting') : t('kpiPlans.exportExcel')}
          </button>
        ) : null}
      </div>

      {isOpen || period.canReopen ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {isOpen ? (
            <>
              <button
                type="button"
                onClick={onCalculate}
                disabled={calculating || period.assignmentCount === 0}
                className="h-11 grow rounded-lg border border-emerald-400/60 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-400/10 disabled:opacity-40 sm:grow-0 dark:text-emerald-400"
              >
                {calculating ? t('kpiPlans.calculatingAll') : t('kpiPlans.calculateAll')}
              </button>
              {previousPeriod ? (
                <button
                  type="button"
                  onClick={onCopy}
                  disabled={copying}
                  className="h-11 grow rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 sm:grow-0 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('kpiPlans.copyFrom', { period: previousPeriod.label })}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                disabled={closing}
                className="h-11 grow rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-40 sm:ml-auto sm:grow-0 dark:border-red-500/40 dark:text-red-400"
              >
                {t('kpiPlans.closePeriod')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onReopen}
              disabled={reopening}
              className="h-11 grow rounded-lg border border-emerald-400/60 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-400/10 disabled:opacity-40 sm:grow-0 dark:text-emerald-400"
            >
              {t('kpiPlans.reopenPeriod')}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function KpiPlansPage() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<Notice>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cardEmployeeId, setCardEmployeeId] = useState<string | null>(null);
  const [newPeriodOpen, setNewPeriodOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const periodsQuery = useQuery({ queryKey: ['kpi-periods'], queryFn: listKpiPeriods });
  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data]);
  // The chosen month lives in the address (?period=2026-09), so a reload or a way back from a
  // plan lands on the same month; without it the newest month is shown.
  const period = periods.find((item) => item.label === searchParams.get('period')) ?? periods[0];
  const previousPeriod = period
    ? periods.find((item) => item.year * 12 + item.month < period.year * 12 + period.month)
    : undefined;

  // The KPI templates screen links here with ?template=<id>: the plans built from that template.
  const templateParam = searchParams.get('template') ?? '';
  const templateId = GUID_PATTERN.test(templateParam) ? templateParam : '';

  function selectPeriod(label: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('period', label);
        return next;
      },
      { replace: true },
    );
  }

  function clearTemplateFilter() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('template');
        return next;
      },
      { replace: true },
    );
  }

  const listQuery = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(templateId ? { templateId } : {}),
    }),
    [search, templateId],
  );
  const plansQuery = useInfiniteQuery({
    queryKey: ['kpi-plans', 'period', period?.id, listQuery],
    queryFn: ({ pageParam }) => listKpiPlans(period?.id ?? '', pageParam, listQuery),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
    enabled: Boolean(period),
  });
  const plans = useMemo(
    () => plansQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [plansQuery.data],
  );
  const firstPage = plansQuery.data?.pages[0];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && plansQuery.hasNextPage && !plansQuery.isFetchingNextPage) {
        void plansQuery.fetchNextPage();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [plansQuery]);
  // The chip names the template even in a month none of its plans are in.
  const filterTemplateQuery = useQuery({
    queryKey: ['kpi-templates', templateId],
    queryFn: () => getKpiTemplate(templateId),
    enabled: templateId !== '',
  });
  const filterTemplateName = filterTemplateQuery.data?.name ?? plans[0]?.templateName ?? '…';

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kpi-periods'] }),
      queryClient.invalidateQueries({ queryKey: ['kpi-plans'] }),
    ]);
  }

  const openPeriodMutation = useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => ensureKpiPeriod(year, month),
    onSuccess: async (opened) => {
      setNewPeriodOpen(false);
      selectPeriod(opened.label);
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: localizeApiError(error, t) }),
  });

  // Closing, reopening and the Excel download ask for the person's own password first
  // (ADR-053, ADR-059).
  const [passwordAction, setPasswordAction] = useState<{
    kind: 'close' | 'reopen' | 'export';
    periodId: string;
    message: string;
  } | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /** A wrong password or a lock keeps the dialog open; anything else closes it. */
  function handlePeriodActionError(error: unknown) {
    if (isPasswordProblem(error)) {
      setPasswordError(
        error instanceof ApiError && error.status === 429
          ? localizeApiError(error, t)
          : t('passwordConfirm.wrong'),
      );
      return;
    }

    setPasswordAction(null);
    setNotice({ tone: 'error', text: describePeriodError(error, t, locale) });
  }

  const closeMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      closeKpiPeriod(id, password),
    onSuccess: async (closed) => {
      setPasswordAction(null);
      setNotice({ tone: 'success', text: t('kpiPlans.closed', { period: closed.label }) });
      await refresh();
    },
    onError: handlePeriodActionError,
  });

  const reopenMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      reopenKpiPeriod(id, password),
    onSuccess: async (reopened) => {
      setPasswordAction(null);
      setNotice({ tone: 'success', text: t('kpiPlans.reopened', { period: reopened.label }) });
      await refresh();
    },
    onError: handlePeriodActionError,
  });

  const exportMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      exportKpiPeriod(id, password, locale),
    onSuccess: async (file, { id }) => {
      const label = periods.find((item) => item.id === id)?.label ?? 'KPI';
      const fileName = file.fileName ?? `${label}_KPI.xlsx`;

      saveFile(file.blob, fileName);
      setPasswordAction(null);
      setNotice({ tone: 'success', text: t('kpiPlans.exported', { file: fileName }) });
      // The download is in the period's history now (ADR-059).
      await queryClient.invalidateQueries({ queryKey: ['audit-logs', 'kpi_periods', id] });
    },
    onError: handlePeriodActionError,
  });

  const copyMutation = useMutation({
    mutationFn: ({ target, source }: { target: string; source: string }) =>
      copyKpiPlans(target, source),
    onSuccess: async (result) => {
      setNotice({
        tone: 'success',
        text:
          result.created === 0
            ? t('kpiPlans.copiedNone')
            : t('kpiPlans.copied', {
                created: formatNumber(result.created, locale),
                skipped: formatNumber(result.skipped.length, locale),
              }),
      });
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: describePeriodError(error, t, locale) }),
  });

  const calculateMutation = useMutation({
    mutationFn: (id: string) => calculateKpiPeriod(id),
    onSuccess: async (result) => {
      setNotice({
        tone: 'success',
        text:
          result.incomplete === 0
            ? t('kpiPlans.calculatedAll', { count: formatNumber(result.calculated, locale) })
            : t('kpiPlans.calculatedAllIncomplete', {
                count: formatNumber(result.calculated, locale),
                incomplete: formatNumber(result.incomplete, locale),
              }),
      });
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: describePeriodError(error, t, locale) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (plan: KpiPlanSummary) => deleteKpiPlan(plan.id),
    onSuccess: async (_result, plan) => {
      setNotice({
        tone: 'success',
        text: t('kpiPlans.deleted', { name: employeeName(plan.employee) }),
      });
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: describePeriodError(error, t, locale) }),
  });

  function closePeriod() {
    if (!period) return;

    // Closing before the reopen window ends can be undone; after it, closing is final.
    const message =
      todayUtc() <= period.reopenableUntil
        ? t('kpiPlans.closeConfirm', {
            period: period.label,
            date: formatDate(period.reopenableUntil, locale),
          })
        : t('kpiPlans.closeConfirmFinal', { period: period.label });

    setPasswordError(null);
    setPasswordAction({ kind: 'close', periodId: period.id, message });
  }

  function reopenPeriod() {
    if (!period) return;

    setPasswordError(null);
    setPasswordAction({
      kind: 'reopen',
      periodId: period.id,
      message: t('kpiPlans.reopenPasswordMessage', { period: period.label }),
    });
  }

  function exportPeriod() {
    if (!period) return;

    setPasswordError(null);
    setPasswordAction({
      kind: 'export',
      periodId: period.id,
      message: t('kpiPlans.exportPasswordMessage', { period: period.label }),
    });
  }

  async function copyFromPrevious() {
    if (!period || !previousPeriod) return;

    if (
      await confirmAction({
        message: t('kpiPlans.copyConfirm', { period: previousPeriod.label }),
        tone: 'default',
      })
    ) {
      copyMutation.mutate({ target: period.id, source: previousPeriod.id });
    }
  }

  async function removePlan(plan: KpiPlanSummary) {
    if (!period) return;

    const confirmed = await confirmAction({
      message: t('kpiPlanForm.deleteConfirm', {
        name: employeeName(plan.employee),
        period: period.label,
      }),
      tone: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(plan);
    }
  }

  const isOpenPeriod = period?.status === 'open';
  // The pay summary has a column beside the period card once the month has plans.
  const summaryColumn = (period?.assignmentCount ?? 0) > 0;

  return (
    <AppShell
      title={t('kpiPlans.title')}
      fullWidth
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('kpiPlans.title') },
      ]}
      recordInfo={
        period ? { tableName: 'kpi_periods', recordId: period.id, title: period.label } : undefined
      }
    >
      {/* One tap shows every salary figure of the list for twenty seconds (ADR-049). */}
      <SalaryRevealProvider>
        {periodsQuery.isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('kpiPlans.loading')}
          </p>
        ) : null}

        {!periodsQuery.isLoading && periods.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('kpiPlans.emptyPeriods')}
            </p>
            <button
              type="button"
              onClick={() => setNewPeriodOpen(true)}
              className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <PlusIcon className="h-4 w-4" />
              {t('kpiPlans.newPeriod')}
            </button>
          </div>
        ) : null}

        {/* Phone: period, notice, search, pay summary, one under the other (DOM order).
            Desktop: period and pay summary share the first row at the same height; the notice
            and the search run full width under them, the search right above the table. */}
        {period || notice ? (
          <div className="flex flex-col gap-3 px-4 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
            {period ? (
              <PeriodPanel
                periods={periods}
                period={period}
                previousPeriod={previousPeriod}
                onSelect={selectPeriod}
                onNewPeriod={() => setNewPeriodOpen(true)}
                onCalculate={() => calculateMutation.mutate(period.id)}
                onCopy={() => void copyFromPrevious()}
                onClose={closePeriod}
                onReopen={reopenPeriod}
                onExport={exportPeriod}
                calculating={calculateMutation.isPending}
                copying={copyMutation.isPending}
                closing={closeMutation.isPending}
                reopening={reopenMutation.isPending}
                exporting={exportMutation.isPending}
                className={`lg:order-1 ${summaryColumn ? '' : 'lg:col-span-2'}`}
              />
            ) : null}

            {notice ? (
              <p
                role="status"
                className={`rounded-lg px-3 py-2 text-sm lg:order-3 lg:col-span-2 ${
                  notice.tone === 'success'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {notice.text}
              </p>
            ) : null}

            {period ? (
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:order-4 lg:col-span-2">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('kpiPlans.searchPlaceholder')}
                  aria-label={t('kpiPlans.searchPlaceholder')}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 sm:max-w-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
                {templateId ? (
                  <span className="inline-flex min-h-[44px] max-w-full items-center gap-1 self-start rounded-full bg-emerald-400/15 pl-3 text-sm font-medium text-emerald-700 sm:self-auto dark:text-emerald-300">
                    <span className="truncate">
                      {t('kpiPlans.templateFilter', { name: filterTemplateName })}
                    </span>
                    <button
                      type="button"
                      onClick={clearTemplateFilter}
                      aria-label={t('kpiPlans.clearTemplateFilter')}
                      title={t('kpiPlans.clearTemplateFilter')}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-emerald-400/20"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                ) : null}
              </div>
            ) : null}

            {summaryColumn ? (
              firstPage ? (
                <PlanSalarySummary
                  summary={firstPage.salarySummary}
                  periodOpen={isOpenPeriod}
                  // A search that matches nothing hides it on the phone, as before.
                  className={`lg:order-2 ${firstPage.total > 0 ? '' : 'hidden lg:block'}`}
                />
              ) : (
                // Holds the column while the list loads, so the period card does not jump.
                <div
                  aria-hidden="true"
                  className="hidden rounded-2xl border border-slate-200 bg-white lg:order-2 lg:block dark:border-slate-800 dark:bg-slate-900"
                />
              )
            ) : null}
          </div>
        ) : null}

        {plansQuery.isError ? (
          <p
            role="alert"
            className="mx-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
          >
            {t('kpiPlans.errorLoading')}
          </p>
        ) : null}

        {period && !plansQuery.isLoading && plans.length === 0 && !plansQuery.isError ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {search
              ? t('kpiPlans.noSearchResults')
              : templateId
                ? t('kpiPlans.noTemplatePlans')
                : t('kpiPlans.empty')}
          </p>
        ) : null}

        {plans.length > 0 ? (
          <>
            {/* The plan count is in the pay summary above, which follows the search too. */}
            <div className="flex flex-col gap-2 px-4 pb-28 lg:hidden">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={isOpenPeriod ? () => void removePlan(plan) : undefined}
                  onOpenCard={() => setCardEmployeeId(plan.employee.id)}
                  deleting={deleteMutation.isPending}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto pb-28 lg:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                    <th className="py-2 pl-4 pr-3 font-medium">{t('kpiPlans.columnEmployee')}</th>
                    <th className="py-2 pr-3 text-right font-medium">
                      {t('kpiPlans.columnTargets')}
                    </th>
                    <th className="py-2 pr-3 text-right font-medium">
                      {t('kpiPlans.columnScore')}
                    </th>
                    <th className="py-2 pr-3 text-right font-medium">
                      {t('kpiPlans.salaryPayable')}
                    </th>
                    <th className="py-2 pr-4 text-right font-medium">
                      {t('kpiPlans.columnActions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900"
                    >
                      <td className="py-1.5 pl-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <EmployeeAvatarButton
                            person={plan.employee}
                            avatarPath={plan.employee.avatarUrl}
                            onOpenCard={() => setCardEmployeeId(plan.employee.id)}
                            avatarClassName="h-9 w-9 text-xs"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/kpi-plans/${plan.id}`}
                              className="text-sm font-medium text-slate-900 dark:text-slate-100"
                            >
                              {employeeName(plan.employee)}
                            </Link>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">
                              @{plan.employee.username}
                              {plan.employee.jobTitle ? ` · ${plan.employee.jobTitle}` : ''}
                            </span>
                            <span className="block text-xs text-slate-600 dark:text-slate-300">
                              {plan.templateName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`whitespace-nowrap py-2.5 pr-3 text-right text-sm tabular-nums ${
                          plan.targetCount < plan.itemCount
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t('kpiPlans.targetProgress', {
                          done: formatNumber(plan.targetCount, locale),
                          total: formatNumber(plan.itemCount, locale),
                        })}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-sm text-slate-400 dark:text-slate-500">
                        {plan.totalScore === null ? (
                          t('kpiPlans.noScore')
                        ) : (
                          <PlanScoreMeter
                            score={plan.totalScore}
                            name={employeeName(plan.employee)}
                            compact
                            className="ml-auto w-28 xl:w-36"
                          />
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <PlanSalaryCell salary={plan.salary} />
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/kpi-plans/${plan.id}`}
                            aria-label={t('kpiPlans.openPlan', {
                              name: employeeName(plan.employee),
                            })}
                            className="inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
                          >
                            {t('kpiPlans.openPlanShort')}
                          </Link>
                          {isOpenPeriod ? (
                            <DeletePlanButton
                              name={employeeName(plan.employee)}
                              onDelete={() => void removePlan(plan)}
                              disabled={deleteMutation.isPending}
                            />
                          ) : null}
                          <RecordInfoButton
                            tableName="kpi_assignments"
                            recordId={plan.id}
                            title={employeeName(plan.employee)}
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
        {plansQuery.isFetchingNextPage ? (
          <p className="py-4 text-center text-xs text-slate-500">{t('kpiPlans.loading')}</p>
        ) : null}

        {period && isOpenPeriod ? (
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="fixed bottom-6 right-6 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-emerald-400 pl-4 pr-5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 active:scale-95"
          >
            <PlusIcon className="h-6 w-6" />
            {t('kpiPlans.assign')}
          </button>
        ) : null}

        <NewPeriodDrawer
          open={newPeriodOpen}
          onClose={() => setNewPeriodOpen(false)}
          onSubmit={(year, month) => openPeriodMutation.mutate({ year, month })}
          pending={openPeriodMutation.isPending}
        />

        {period ? (
          <AssignDrawer
            open={assignOpen}
            period={period}
            onClose={() => setAssignOpen(false)}
            onAssigned={async (count) => {
              setAssignOpen(false);
              setNotice({
                tone: 'success',
                text: t('kpiPlans.assigned', { count: formatNumber(count, locale) }),
              });
              await refresh();
            }}
            onError={(text) => setNotice({ tone: 'error', text })}
          />
        ) : null}
        {passwordAction ? (
          <PasswordConfirmModal
            title={t(PASSWORD_ACTION_TITLES[passwordAction.kind])}
            message={passwordAction.message}
            confirmLabel={t(PASSWORD_ACTION_CONFIRMS[passwordAction.kind])}
            tone={passwordAction.kind === 'export' ? 'primary' : 'danger'}
            pending={
              closeMutation.isPending || reopenMutation.isPending || exportMutation.isPending
            }
            error={passwordError}
            onClose={() => setPasswordAction(null)}
            onConfirm={(password) => {
              setPasswordError(null);
              const input = { id: passwordAction.periodId, password };

              switch (passwordAction.kind) {
                case 'close':
                  return closeMutation.mutateAsync(input);
                case 'reopen':
                  return reopenMutation.mutateAsync(input);
                case 'export':
                  return exportMutation.mutateAsync(input);
              }
            }}
          />
        ) : null}
        <EmployeeCardModal employeeId={cardEmployeeId} onClose={() => setCardEmployeeId(null)} />
      </SalaryRevealProvider>
    </AppShell>
  );
}

function NewPeriodDrawer({
  open,
  onClose,
  onSubmit,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (year: number, month: number) => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      variant="overlay"
      as="aside"
      label={t('kpiPlans.newPeriodTitle')}
      panelClassName="w-[92vw] max-w-sm"
    >
      <div className="flex flex-col gap-4 overflow-y-auto p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('kpiPlans.newPeriodTitle')}
        </h2>

        <FormField label={t('kpiPlans.year')} htmlFor="kpi-period-year">
          <input
            id="kpi-period-year"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className={formInputClassName}
          />
        </FormField>

        <FormField label={t('kpiPlans.month')} htmlFor="kpi-period-month">
          <select
            id="kpi-period-month"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className={formInputClassName}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {String(value).padStart(2, '0')}
              </option>
            ))}
          </select>
        </FormField>

        <button
          type="button"
          disabled={pending}
          onClick={() => onSubmit(year, month)}
          className="h-12 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {t('kpiPlans.open')}
        </button>
      </div>
    </Drawer>
  );
}

function AssignDrawer({
  open,
  period,
  onClose,
  onAssigned,
  onError,
}: {
  open: boolean;
  period: KpiPeriod;
  onClose: () => void;
  onAssigned: (count: number) => Promise<void> | void;
  onError: (text: string) => void;
}) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(employeeSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  const templatesQuery = useQuery({
    queryKey: ['kpi-templates', 'list', { isActive: true }],
    queryFn: () => listKpiTemplates(1, { isActive: true }),
    enabled: open,
  });
  const employeesQuery = useQuery({
    queryKey: ['employees', 'assignable', search],
    queryFn: () => listEmployees(1, { isActive: true, ...(search ? { search } : {}) }),
    enabled: open,
  });
  const employees = employeesQuery.data?.items ?? [];

  const assignMutation = useMutation({
    mutationFn: () => assignKpiTemplate(period.id, templateId, selected),
    onSuccess: async (created) => {
      setSelected([]);
      setTemplateId('');
      await onAssigned(created.length);
    },
    onError: (error) => onError(describeAssignError(error, t, employees)),
  });

  const canSubmit = templateId !== '' && selected.length > 0 && !assignMutation.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      variant="overlay"
      as="aside"
      label={t('kpiPlans.assignTitle')}
      panelClassName="w-[92vw] max-w-md"
    >
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('kpiPlans.assignTitle')} · {period.label}
        </h2>

        <FormField label={t('kpiPlans.templateLabel')} htmlFor="kpi-plan-template" required>
          <select
            id="kpi-plan-template"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className={formInputClassName}
          >
            <option value="">{t('kpiPlans.selectTemplate')}</option>
            {(templatesQuery.data?.items ?? []).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('kpiPlans.employeesLabel')}
          </p>
          <input
            type="search"
            value={employeeSearch}
            onChange={(event) => setEmployeeSearch(event.target.value)}
            placeholder={t('kpiPlans.employeeSearch')}
            aria-label={t('kpiPlans.employeeSearch')}
            className={formInputClassName}
          />

          <div className="mt-2 flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center gap-2 pr-3">
                <SelectCheckbox
                  checked={selected.includes(employee.id)}
                  onChange={(checked) =>
                    setSelected((previous) =>
                      checked
                        ? [...previous, employee.id]
                        : previous.filter((id) => id !== employee.id),
                    )
                  }
                  label={employeeName(employee)}
                />
                <PersonAvatar
                  person={employee}
                  path={
                    employee.avatar
                      ? (employee.avatar.smallImageUrl ?? employee.avatar.contentUrl)
                      : null
                  }
                  className="h-8 w-8 text-[11px]"
                />
                <span className="min-w-0 flex-1 py-2">
                  <span className="block truncate text-sm text-slate-900 dark:text-slate-100">
                    {employeeName(employee)}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    @{employee.username}
                    {employee.erpEmployeeId === null
                      ? ` · ${t('kpiPlans.reasonMissingErpLink')}`
                      : ''}
                  </span>
                </span>
              </div>
            ))}
            {employees.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('kpiPlans.employeesEmpty')}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => assignMutation.mutate()}
          className="mt-auto h-12 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
        >
          {t('kpiPlans.assignSubmit')}
        </button>
      </div>
    </Drawer>
  );
}

/** The password was wrong or is locked after too many tries: the dialog stays open. */
const PASSWORD_ACTION_TITLES = {
  close: 'kpiPlans.closePeriod',
  reopen: 'kpiPlans.reopenPeriod',
  export: 'kpiPlans.exportTitle',
} as const satisfies Record<string, TranslationKey>;

const PASSWORD_ACTION_CONFIRMS = {
  close: 'kpiPlans.closePeriod',
  reopen: 'kpiPlans.reopenPeriod',
  export: 'kpiPlans.exportConfirm',
} as const satisfies Record<string, TranslationKey>;

function isPasswordProblem(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.body?.code === 'AUTH_PASSWORD_CONFIRMATION_FAILED')
  );
}
