import type { KpiScope, KpiUnit } from '../kpi-definitions/kpi-definition.types.js';

/** Largest value that fits kpi_assignment_items.target_value decimal(19,4). */
export const MAX_TARGET_VALUE = 999_999_999_999_999;
export const MAX_TARGET_DECIMALS = 4;

export type TargetProblem = 'negative' | 'too-large' | 'decimals' | 'percent';

/**
 * A target is a number the plan is measured against: never negative, at most four
 * decimals (the column's scale) and at most 100 for a percentage KPI. `null` clears it.
 */
export function findTargetProblem(value: number | null, unit: KpiUnit): TargetProblem | null {
  if (value === null) {
    return null;
  }

  if (value < 0) {
    return 'negative';
  }

  if (value > MAX_TARGET_VALUE) {
    return 'too-large';
  }

  // 12.3456 * 10^4 is 123456.00000000001 in binary floating point, so the scaled value is
  // compared with a tolerance instead of Number.isInteger.
  const scaled = value * 10 ** MAX_TARGET_DECIMALS;

  if (Math.abs(scaled - Math.round(scaled)) > 1e-6) {
    return 'decimals';
  }

  return unit === 'percent' && value > 100 ? 'percent' : null;
}

/** How far a copy may change its targets, in percent (ADR-070). */
export const MIN_TARGET_CHANGE_PERCENT = -90;
export const MAX_TARGET_CHANGE_PERCENT = 300;
export const TARGET_CHANGE_DECIMALS = 2;

/**
 * A target copied with a change of `percent` (+10 makes 100 into 110). Money and count
 * targets become whole numbers, percent and score targets keep two decimals, and a
 * percentage KPI never passes 100. 0% copies the value as it is; no target stays none.
 */
export function changeTarget(value: number | null, percent: number, unit: KpiUnit): number | null {
  if (value === null || percent === 0) {
    return value;
  }

  const decimals = unit === 'money' || unit === 'count' ? 0 : TARGET_CHANGE_DECIMALS;
  const factor = 10 ** decimals;
  // EPSILON nudges halves that binary floating point stores just below .5 (1.005) upwards.
  const changed = Math.round(((value * (100 + percent)) / 100 + Number.EPSILON) * factor) / factor;
  const limit = unit === 'percent' ? 100 : MAX_TARGET_VALUE;

  return Math.min(changed, limit);
}

/**
 * `EMPLOYEE_*` KPIs are measured through the employee's Tiger salesperson reference, so a
 * template that holds one can only be assigned to a linked employee.
 */
export function requiresErpLink(scopes: readonly KpiScope[]): boolean {
  return scopes.includes('employee');
}

export type IneligibleReason = 'inactive' | 'missing-erp-link';

export interface AssignableEmployee {
  id: string;
  isActive: boolean;
  erpEmployeeId: number | null;
}

export interface IneligibleEmployee {
  employeeId: string;
  reason: IneligibleReason;
}

/** Employees the template cannot be assigned to, in the order they were requested. */
export function findIneligibleEmployees(
  employees: readonly AssignableEmployee[],
  options: { requiresErpLink: boolean },
): IneligibleEmployee[] {
  return employees.flatMap((employee): IneligibleEmployee[] => {
    if (!employee.isActive) {
      return [{ employeeId: employee.id, reason: 'inactive' as const }];
    }

    return options.requiresErpLink && employee.erpEmployeeId === null
      ? [{ employeeId: employee.id, reason: 'missing-erp-link' as const }]
      : [];
  });
}

export interface PlanItemValues {
  kpiDefinitionId: string;
  weight: number;
  targetValue: number | null;
  inputValues: string;
  sortOrder: number;
}

/**
 * A plan's KPI rows are a copy of the template's rows: only the target is the employee's
 * own, the KPI, its weight and its inputs stay as the template had them (ADR-039).
 */
export function planItemsFromTemplate(items: readonly PlanItemValues[]): PlanItemValues[] {
  return items.map((item, index) => ({
    kpiDefinitionId: item.kpiDefinitionId,
    weight: item.weight,
    targetValue: item.targetValue,
    inputValues: item.inputValues,
    sortOrder: index + 1,
  }));
}
