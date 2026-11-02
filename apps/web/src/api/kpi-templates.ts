import { apiFetch } from '../lib/api-client';
import { chunkIds } from '../lib/bulk';
import type {
  BulkDeleteResponse,
  BulkUpdateResponse,
  KpiTemplate,
  KpiTemplateBulkCopyResponse,
  KpiTemplateListResponse,
  SaveKpiTemplateInput,
} from '../types/api';

const KPI_TEMPLATES_PAGE_SIZE = 20;

export interface KpiTemplateListQuery {
  search?: string;
  isActive?: boolean;
}

export function listKpiTemplates(
  page: number,
  query: KpiTemplateListQuery = {},
): Promise<KpiTemplateListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(KPI_TEMPLATES_PAGE_SIZE),
  });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return apiFetch<KpiTemplateListResponse>(`/kpi-templates?${params.toString()}`);
}

export function getKpiTemplate(id: string): Promise<KpiTemplate> {
  return apiFetch<KpiTemplate>(`/kpi-templates/${id}`);
}

export function createKpiTemplate(input: SaveKpiTemplateInput): Promise<KpiTemplate> {
  return apiFetch<KpiTemplate>('/kpi-templates', { method: 'POST', body: input });
}

export function updateKpiTemplate(id: string, input: SaveKpiTemplateInput): Promise<KpiTemplate> {
  return apiFetch<KpiTemplate>(`/kpi-templates/${id}`, { method: 'PUT', body: input });
}

export function deactivateKpiTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/kpi-templates/${id}`, { method: 'DELETE' });
}

/** Permanent delete; the API refuses with `KPI_TEMPLATE_IN_USE` when a plan uses it (ADR-040). */
export function deleteKpiTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/kpi-templates/${id}/permanent`, { method: 'DELETE' });
}

/** Deletes every selected template, or none of them when one is used by a plan. */
export async function bulkDeleteKpiTemplates(ids: string[]): Promise<BulkDeleteResponse> {
  let deleted = 0;

  for (const chunk of chunkIds(ids)) {
    const result = await apiFetch<BulkDeleteResponse>('/kpi-templates/bulk-delete', {
      method: 'POST',
      body: { ids: chunk },
    });
    deleted += result.deleted;
  }

  return { deleted };
}

export interface CopyKpiTemplateInput {
  /** Without a name the API appends the next free " (n)". */
  name?: string;
  /** Changes every default target by this percentage (ADR-070); 0 copies them as they are. */
  targetChangePercent?: number;
}

/** Copies the saved template with all items. */
export function copyKpiTemplate(
  id: string,
  input: CopyKpiTemplateInput = {},
): Promise<KpiTemplate> {
  return apiFetch<KpiTemplate>(`/kpi-templates/${id}/copy`, { method: 'POST', body: input });
}

/** Bulk (de)activation from the list screen (ADR-035); `updated` counts rows that changed. */
export async function bulkSetKpiTemplatesActive(
  ids: string[],
  isActive: boolean,
): Promise<BulkUpdateResponse> {
  let updated = 0;

  for (const chunk of chunkIds(ids)) {
    const result = await apiFetch<BulkUpdateResponse>('/kpi-templates/bulk-status', {
      method: 'POST',
      body: { ids: chunk, isActive },
    });
    updated += result.updated;
  }

  return { updated };
}

/**
 * Copies every selected template with its items; each copy gets a " (n)" name and its
 * default targets changed by `targetChangePercent` (ADR-070).
 */
export async function bulkCopyKpiTemplates(
  ids: string[],
  targetChangePercent = 0,
): Promise<KpiTemplateBulkCopyResponse> {
  const copies: KpiTemplateBulkCopyResponse['copies'] = [];

  for (const chunk of chunkIds(ids)) {
    const result = await apiFetch<KpiTemplateBulkCopyResponse>('/kpi-templates/bulk-copy', {
      method: 'POST',
      body: { ids: chunk, targetChangePercent },
    });
    copies.push(...result.copies);
  }

  return { copies };
}
