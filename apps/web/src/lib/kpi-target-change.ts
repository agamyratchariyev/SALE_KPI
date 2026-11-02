import type { KpiUnit } from '../types/api';

/** Same limits and rounding as the API's `changeTarget` (kpi-assignment-rules.ts, ADR-070). */
export const MIN_TARGET_CHANGE_PERCENT = -90;
export const MAX_TARGET_CHANGE_PERCENT = 300;
export const TARGET_CHANGE_PRESETS = [0, 5, 10, 15, 20, 25] as const;

const MAX_TARGET_VALUE = 999_999_999_999_999;

/**
 * The target a copy will have; the preview shows it before the API writes the same number.
 * Money and count become whole numbers, percent and score keep two decimals, a percentage
 * never passes 100, 0% keeps the value as it is and no target stays none.
 */
export function changeTarget(value: number | null, percent: number, unit: KpiUnit): number | null {
  if (value === null || percent === 0) {
    return value;
  }

  const factor = unit === 'money' || unit === 'count' ? 1 : 100;
  const changed = Math.round(((value * (100 + percent)) / 100 + Number.EPSILON) * factor) / factor;

  return Math.min(changed, unit === 'percent' ? 100 : MAX_TARGET_VALUE);
}

/**
 * What was typed in the percentage field: "10", "-7,5", "+12.25". `null` when it is not a
 * number the API accepts (outside the range or more than two decimals).
 */
export function parseTargetChangePercent(text: string): number | null {
  // Some languages format negatives with the minus sign U+2212 instead of a hyphen.
  const normalized = text.trim().replace(',', '.').replace('−', '-').replace(/^\+/, '');

  if (!/^-?\d{1,3}(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized);

  return value >= MIN_TARGET_CHANGE_PERCENT && value <= MAX_TARGET_CHANGE_PERCENT ? value : null;
}
