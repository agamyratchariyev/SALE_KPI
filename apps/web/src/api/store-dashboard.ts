import { apiFetch } from '../lib/api-client';
import type { StoreDashboardResponse, StoreDashboardWeeklyResponse } from '../types/api';

/** Store KPIs #1–#6 of a year against the year before (ADR-061); full access only. */
export function getStoreDashboard(year?: number): Promise<StoreDashboardResponse> {
  return apiFetch<StoreDashboardResponse>(
    `/store-dashboard${year === undefined ? '' : `?year=${String(year)}`}`,
  );
}

/** The recent weeks of the same KPIs (ADR-071); full access only. */
export function getStoreDashboardWeekly(weeks: number): Promise<StoreDashboardWeeklyResponse> {
  return apiFetch<StoreDashboardWeeklyResponse>(`/store-dashboard/weekly?weeks=${String(weeks)}`);
}
