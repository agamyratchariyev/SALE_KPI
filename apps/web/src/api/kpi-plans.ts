import type { Locale } from '../i18n/translations';
import { apiFetch, apiFetchFile, type DownloadedFile } from '../lib/api-client';
import type {
  KpiPeriod,
  KpiPeriodCalculation,
  KpiMyPeriodListResponse,
  KpiPeriodListResponse,
  KpiPlan,
  KpiPlanCopyResult,
  KpiPlanListResponse,
  KpiPlanRecommendationsResponse,
  KpiPlanResults,
  KpiPlanSummary,
  SaveKpiActualsInput,
  SaveKpiTargetsInput,
} from '../types/api';

const PERIODS_PAGE_SIZE = 24;
const PLANS_PAGE_SIZE = 20;
/** One plan per month at most: two years of the employee's own periods. */
const MY_PERIODS_PAGE_SIZE = 24;

export function listKpiPeriods(): Promise<KpiPeriodListResponse> {
  return apiFetch<KpiPeriodListResponse>(`/kpi-periods?page=1&limit=${PERIODS_PAGE_SIZE}`);
}

/** Returns the month's period, opening it when it does not exist yet. */
export function ensureKpiPeriod(year: number, month: number): Promise<KpiPeriod> {
  return apiFetch<KpiPeriod>('/kpi-periods', { method: 'POST', body: { year, month } });
}

/** Closing asks for the signed-in person's own password (ADR-053). */
export function closeKpiPeriod(id: string, password: string): Promise<KpiPeriod> {
  return apiFetch<KpiPeriod>(`/kpi-periods/${id}/close`, { method: 'POST', body: { password } });
}

/**
 * The period's Excel file (ADR-059): every plan with score and salary, and each KPI row.
 * Asks for the person's own password; the download is logged on the period.
 */
export function exportKpiPeriod(
  id: string,
  password: string,
  lang: Locale,
): Promise<DownloadedFile> {
  return apiFetchFile(`/kpi-periods/${id}/export`, { method: 'POST', body: { password, lang } });
}

/** Undoes a closing made too early; allowed until the 10th day after the month (ADR-044). */
export function reopenKpiPeriod(id: string, password: string): Promise<KpiPeriod> {
  return apiFetch<KpiPeriod>(`/kpi-periods/${id}/reopen`, { method: 'POST', body: { password } });
}

export interface KpiPlanListQuery {
  search?: string;
  templateId?: string;
}

export function listKpiPlans(
  periodId: string,
  page: number,
  query: KpiPlanListQuery = {},
): Promise<KpiPlanListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(PLANS_PAGE_SIZE) });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return apiFetch<KpiPlanListResponse>(`/kpi-periods/${periodId}/assignments?${params.toString()}`);
}

export function assignKpiTemplate(
  periodId: string,
  templateId: string,
  employeeIds: string[],
): Promise<KpiPlanSummary[]> {
  return apiFetch<KpiPlanSummary[]>(`/kpi-periods/${periodId}/assignments`, {
    method: 'POST',
    body: { templateId, employeeIds },
  });
}

/**
 * Copies another period's plans with their targets into this one, each target changed by
 * `targetChangePercent` (ADR-070); 0 copies them as they are.
 */
export function copyKpiPlans(
  periodId: string,
  sourcePeriodId: string,
  targetChangePercent = 0,
): Promise<KpiPlanCopyResult> {
  return apiFetch<KpiPlanCopyResult>(`/kpi-periods/${periodId}/copy-assignments`, {
    method: 'POST',
    body: { sourcePeriodId, targetChangePercent },
  });
}

export function getKpiPlan(id: string): Promise<KpiPlan> {
  return apiFetch<KpiPlan>(`/kpi-assignments/${id}`);
}

export function getKpiPlanRecommendations(id: string): Promise<KpiPlanRecommendationsResponse> {
  return apiFetch<KpiPlanRecommendationsResponse>(`/kpi-assignments/${id}/recommendations`);
}

export function saveKpiTargets(id: string, input: SaveKpiTargetsInput): Promise<KpiPlan> {
  return apiFetch<KpiPlan>(`/kpi-assignments/${id}/targets`, { method: 'PUT', body: input });
}

/** Stored results of a plan; the owner may read their own (ADR-041). */
export function getKpiPlanResults(id: string): Promise<KpiPlanResults> {
  return apiFetch<KpiPlanResults>(`/kpi-assignments/${id}/results`);
}

/** Reads the period's month from Tiger and writes the plan's results. */
export function calculateKpiPlan(id: string): Promise<KpiPlanResults> {
  return apiFetch<KpiPlanResults>(`/kpi-assignments/${id}/calculate`, { method: 'POST', body: {} });
}

/** Actual values of the KPIs Tiger cannot measure; the plan is rescored afterwards. */
export function saveKpiActuals(id: string, input: SaveKpiActualsInput): Promise<KpiPlanResults> {
  return apiFetch<KpiPlanResults>(`/kpi-assignments/${id}/actuals`, { method: 'PUT', body: input });
}

/** Calculates every plan of the period in one pass. */
export function calculateKpiPeriod(periodId: string): Promise<KpiPeriodCalculation> {
  return apiFetch<KpiPeriodCalculation>(`/kpi-periods/${periodId}/calculate`, {
    method: 'POST',
    body: {},
  });
}

export function deleteKpiPlan(id: string): Promise<void> {
  return apiFetch<void>(`/kpi-assignments/${id}`, { method: 'DELETE' });
}

/** Periods the signed-in employee has a plan in, newest first, each with its score. */
export function listMyKpiPeriods(): Promise<KpiMyPeriodListResponse> {
  return apiFetch<KpiMyPeriodListResponse>(
    `/kpi-assignments/me/periods?page=1&limit=${MY_PERIODS_PAGE_SIZE}`,
  );
}

/** The signed-in employee's own plan; without a month the newest one. */
export function getMyKpiPlan(month?: { year: number; month: number }): Promise<{
  plan: KpiPlan | null;
}> {
  const params = month ? `?year=${String(month.year)}&month=${String(month.month)}` : '';

  return apiFetch<{ plan: KpiPlan | null }>(`/kpi-assignments/me${params}`);
}

/** Periods an employee has a plan in; the administrator's view of `listMyKpiPeriods`. */
export function listEmployeeKpiPeriods(employeeId: string): Promise<KpiMyPeriodListResponse> {
  return apiFetch<KpiMyPeriodListResponse>(
    `/kpi-assignments/employees/${employeeId}/periods?page=1&limit=${MY_PERIODS_PAGE_SIZE}`,
  );
}

/** An employee's plan; the administrator's view of `getMyKpiPlan`. */
export function getEmployeeKpiPlan(
  employeeId: string,
  month?: { year: number; month: number },
): Promise<{ plan: KpiPlan | null }> {
  const params = month ? `?year=${String(month.year)}&month=${String(month.month)}` : '';

  return apiFetch<{ plan: KpiPlan | null }>(`/kpi-assignments/employees/${employeeId}${params}`);
}
