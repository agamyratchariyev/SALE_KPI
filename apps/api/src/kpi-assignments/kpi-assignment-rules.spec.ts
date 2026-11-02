import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_TARGET_VALUE,
  changeTarget,
  findIneligibleEmployees,
  findTargetProblem,
  planItemsFromTemplate,
  requiresErpLink,
} from './kpi-assignment-rules.js';

void test('a copy without a change keeps every target exactly as it was', () => {
  assert.equal(changeTarget(12.3456, 0, 'money'), 12.3456);
  assert.equal(changeTarget(18.125, 0, 'percent'), 18.125);
  assert.equal(changeTarget(null, 0, 'money'), null);
});

void test('changes money and count targets by the percentage, as whole numbers', () => {
  assert.equal(changeTarget(347_621, 10, 'money'), 382_383);
  assert.equal(changeTarget(1_000, 7.5, 'money'), 1_075);
  assert.equal(changeTarget(120, -15, 'count'), 102);
  // 45 * 1.1 = 49.5 rounds up, not down to the 49.49999… floating point gives.
  assert.equal(changeTarget(45, 10, 'count'), 50);
  assert.equal(changeTarget(null, 10, 'count'), null);
});

void test('percent targets keep two decimals and never pass 100', () => {
  assert.equal(changeTarget(18, 10, 'percent'), 19.8);
  assert.equal(changeTarget(1.005, 0.5, 'percent'), 1.01);
  assert.equal(changeTarget(95, 10, 'percent'), 100);
  assert.equal(changeTarget(40, -12.5, 'score'), 35);
});

void test('a changed target still fits the target column', () => {
  assert.equal(changeTarget(MAX_TARGET_VALUE, 300, 'money'), MAX_TARGET_VALUE);
  // Every change keeps the target inside what findTargetProblem accepts.
  for (const [value, unit] of [
    [347_621.1234, 'money'],
    [33.3333, 'percent'],
    [7, 'count'],
  ] as const) {
    for (const percent of [-90, -33.33, 12.34, 300]) {
      assert.equal(findTargetProblem(changeTarget(value, percent, unit), unit), null);
    }
  }
});

void test('accepts targets the target column can hold', () => {
  assert.equal(findTargetProblem(null, 'money'), null);
  assert.equal(findTargetProblem(0, 'count'), null);
  assert.equal(findTargetProblem(347_621, 'money'), null);
  // 12.3456 * 10^4 is not exactly 123456 in floating point; four decimals still fit.
  assert.equal(findTargetProblem(12.3456, 'money'), null);
  assert.equal(findTargetProblem(0.0001, 'money'), null);
  assert.equal(findTargetProblem(100, 'percent'), null);
});

void test('rejects negative, too large, too precise and impossible percentage targets', () => {
  assert.equal(findTargetProblem(-1, 'money'), 'negative');
  assert.equal(findTargetProblem(MAX_TARGET_VALUE + 1, 'money'), 'too-large');
  assert.equal(findTargetProblem(12.34567, 'money'), 'decimals');
  assert.equal(findTargetProblem(101, 'percent'), 'percent');
  // A percentage over 100 is the only unit-specific limit; other units allow any amount.
  assert.equal(findTargetProblem(101, 'count'), null);
});

void test('a template with an employee KPI needs the Tiger salesperson link', () => {
  assert.equal(requiresErpLink(['store', 'employee']), true);
  assert.equal(requiresErpLink(['store', 'store']), false);
  assert.equal(requiresErpLink([]), false);
});

void test('lists the employees a template cannot be given to, with the reason', () => {
  const employees = [
    { id: 'a', isActive: true, erpEmployeeId: 34 },
    { id: 'b', isActive: false, erpEmployeeId: 35 },
    { id: 'c', isActive: true, erpEmployeeId: null },
  ];

  assert.deepEqual(findIneligibleEmployees(employees, { requiresErpLink: true }), [
    { employeeId: 'b', reason: 'inactive' },
    { employeeId: 'c', reason: 'missing-erp-link' },
  ]);
  assert.deepEqual(findIneligibleEmployees(employees, { requiresErpLink: false }), [
    { employeeId: 'b', reason: 'inactive' },
  ]);
});

void test('plan rows copy the template rows and are numbered from one', () => {
  const items = [
    {
      kpiDefinitionId: 'kpi-1',
      weight: 60,
      targetValue: 500,
      inputValues: '{"storeIds":[6]}',
      sortOrder: 7,
    },
    {
      kpiDefinitionId: 'kpi-2',
      weight: 40,
      targetValue: null,
      inputValues: '{}',
      sortOrder: 9,
    },
  ];

  assert.deepEqual(planItemsFromTemplate(items), [
    { ...items[0], sortOrder: 1 },
    { ...items[1], sortOrder: 2 },
  ]);
});
