import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  compareYears,
  growthPercent,
  monthStatus,
  monthlyValues,
  planRefresh,
  refreshWindow,
  type MonthAmount,
  type StoreMonthValue,
} from './store-dashboard-rules.js';

/** Plain monthly values as the amounts compareYears reads. */
function amounts(entries: [string, number][]): Map<string, MonthAmount> {
  return new Map(entries.map(([month, value]) => [month, { value, parts: null }]));
}

/** monthlyValues without the parts, for the KPIs that are not rates. */
function valuesOf(map: Map<string, MonthAmount>): [string, number][] {
  return [...map].map(([month, amount]) => [month, amount.value]);
}

void test('refreshes January of last year through the current month', () => {
  assert.deepEqual(refreshWindow('2026-09-29'), { from: '2025-01-01', to: '2026-09-01' });
  assert.deepEqual(refreshWindow('2027-01-01'), { from: '2026-01-01', to: '2027-01-01' });
});

void test('a month is complete, in progress or upcoming against the current month', () => {
  assert.equal(monthStatus(2026, 8, '2026-09'), 'complete');
  assert.equal(monthStatus(2026, 9, '2026-09'), 'inProgress');
  assert.equal(monthStatus(2026, 10, '2026-09'), 'upcoming');
  assert.equal(monthStatus(2025, 12, '2026-09'), 'complete');
});

void test('growth needs a positive base and keeps one decimal', () => {
  assert.equal(growthPercent(112, 100), 12);
  assert.equal(growthPercent(90, 120), -25);
  assert.equal(growthPercent(1, 3), -66.7);
  assert.equal(growthPercent(5, 0), null);
  assert.equal(growthPercent(5, -10), null);
  assert.equal(growthPercent(null, 10), null);
  assert.equal(growthPercent(10, null), null);
});

void test('compares only finished months that have values in both years', () => {
  const values = amounts([
    ['2025-03', 100],
    ['2025-04', 200],
    ['2025-05', 50],
    ['2025-09', 400],
    ['2026-03', 150],
    ['2026-04', 180],
    ['2026-08', 70],
    ['2026-09', 20],
  ]);
  const { months, summary } = compareYears(values, 2026, '2026-09', 'sum');

  assert.equal(months.length, 12);
  assert.deepEqual(months[2], {
    month: 3,
    status: 'complete',
    current: 150,
    previous: 100,
    growthPercent: 50,
    previousMonth: null,
    previousMonthGrowthPercent: null,
  });
  // May had sales last year only; August this year only; September is still running.
  assert.equal(months[4]?.growthPercent, null);
  assert.equal(months[7]?.growthPercent, null);
  assert.deepEqual(months[8], {
    month: 9,
    status: 'inProgress',
    current: 20,
    previous: 400,
    growthPercent: null,
    previousMonth: null,
    previousMonthGrowthPercent: null,
  });
  assert.equal(months[9]?.status, 'upcoming');

  assert.deepEqual(summary, {
    comparableMonths: [3, 4],
    current: 330,
    previous: 300,
    difference: 30,
    growthPercent: 10,
    currentYearValue: 400,
    currentYearMonths: 3,
    previousYearValue: 750,
    previousYearMonths: 4,
  });
});

void test('a finished month is compared with the month before; January with last December', () => {
  const values = amounts([
    ['2025-12', 80],
    ['2026-01', 100],
    ['2026-02', 125],
    ['2026-03', 100],
    ['2026-05', 60],
    ['2026-07', 0],
    ['2026-08', 50],
    ['2026-09', 30],
  ]);
  const { months } = compareYears(values, 2026, '2026-09', 'sum');
  const change = (month: number) => {
    const entry = months[month - 1];

    return [entry?.previousMonth, entry?.previousMonthGrowthPercent];
  };

  assert.deepEqual(change(1), [80, 25]);
  assert.deepEqual(change(2), [100, 25]);
  assert.deepEqual(change(3), [125, -20]);
  // April has no value; May has no month before; August has a zero base.
  assert.deepEqual(change(4), [100, null]);
  assert.deepEqual(change(5), [null, null]);
  assert.deepEqual(change(8), [0, null]);
  // September is still running, October lies ahead.
  assert.deepEqual(change(9), [null, null]);
  assert.deepEqual(change(10), [null, null]);
});

void test('distinct counts compare monthly averages; growth equals the sum comparison', () => {
  const values = amounts([
    ['2025-01', 100],
    ['2025-02', 300],
    ['2026-01', 150],
    ['2026-02', 330],
  ]);
  const average = compareYears(values, 2026, '2026-09', 'average').summary;
  const sum = compareYears(values, 2026, '2026-09', 'sum').summary;

  assert.equal(average.current, 240);
  assert.equal(average.previous, 200);
  assert.equal(average.growthPercent, 20);
  assert.equal(sum.growthPercent, average.growthPercent);
});

void test('without last year the comparison is empty but this year still adds up', () => {
  const values = amounts([
    ['2026-03', 10],
    ['2026-04', 20],
  ]);
  const { summary } = compareYears(values, 2026, '2026-09', 'sum');

  assert.deepEqual(summary.comparableMonths, []);
  assert.equal(summary.current, null);
  assert.equal(summary.growthPercent, null);
  assert.equal(summary.currentYearValue, 30);
  assert.equal(summary.previousYearValue, null);
  assert.equal(summary.previousYearMonths, 0);
});

void test('a past year is compared in full', () => {
  const values = amounts([
    ['2025-12', 200],
    ['2024-12', 100],
  ]);
  const { months, summary } = compareYears(values, 2025, '2026-09', 'sum');

  assert.equal(months[11]?.status, 'complete');
  assert.equal(summary.growthPercent, 100);
});

function row(
  storeNr: number,
  monthStart: string,
  kpiCode: string,
  currency: string | null,
  value: number,
  parts: [number, number] | null = null,
): StoreMonthValue {
  return {
    storeNr,
    monthStart,
    kpiCode,
    currency,
    value,
    numerator: parts?.[0] ?? null,
    denominator: parts?.[1] ?? null,
  };
}

const ROWS: StoreMonthValue[] = [
  row(0, '2026-03-01', 'STORE_SALES', 'TMT', 100),
  row(0, '2026-03-01', 'STORE_SALES', 'USD', 5),
  row(1, '2026-03-01', 'STORE_SALES', 'TMT', 40),
  row(1, '2026-04-01', 'STORE_SALES', 'TMT', 60),
  row(0, '2026-03-01', 'STORE_RECEIPTS', null, 9),
];

void test('monthly values of one store, or of every store added together', () => {
  assert.deepEqual(valuesOf(monthlyValues(ROWS, 'STORE_SALES', 'TMT', null, 'sum')), [
    ['2026-03', 140],
    ['2026-04', 60],
  ]);
  assert.deepEqual(valuesOf(monthlyValues(ROWS, 'STORE_SALES', 'TMT', 0, 'sum')), [
    ['2026-03', 100],
  ]);
  assert.deepEqual(valuesOf(monthlyValues(ROWS, 'STORE_SALES', 'USD', null, 'sum')), [
    ['2026-03', 5],
  ]);
  assert.deepEqual(valuesOf(monthlyValues(ROWS, 'STORE_RECEIPTS', null, null, 'sum')), [
    ['2026-03', 9],
  ]);
});

const CONVERSION: StoreMonthValue[] = [
  // Store 0: 300 receipts of 1,000 visitors; store 1: 50 of 500.
  row(0, '2026-07-01', 'STORE_CONVERSION', null, 30, [300, 1000]),
  row(1, '2026-07-01', 'STORE_CONVERSION', null, 10, [50, 500]),
  row(0, '2026-08-01', 'STORE_CONVERSION', null, 25, [250, 1000]),
  row(0, '2025-07-01', 'STORE_CONVERSION', null, 20, [200, 1000]),
  row(0, '2025-08-01', 'STORE_CONVERSION', null, 40, [120, 300]),
];

void test('the conversion of several stores adds receipts and visitors, then divides', () => {
  const all = monthlyValues(CONVERSION, 'STORE_CONVERSION', null, null, 'ratio');

  // (300 + 50) / (1,000 + 500) = 23.33 %, not the average of 30 % and 10 %.
  assert.deepEqual(all.get('2026-07'), {
    value: 23.33,
    parts: { numerator: 350, denominator: 1500 },
  });
  assert.equal(
    monthlyValues(CONVERSION, 'STORE_CONVERSION', null, 1, 'ratio').get('2026-07')?.value,
    10,
  );
});

void test('the conversion of a period divides the months receipts by their visitors', () => {
  const values = monthlyValues(CONVERSION, 'STORE_CONVERSION', null, 0, 'ratio');
  const { months, summary } = compareYears(values, 2026, '2026-09', 'ratio');

  assert.equal(months[6]?.growthPercent, 50);
  // 2026: 550 / 2,000 = 27.5 %; 2025: 320 / 1,300 = 24.62 %.
  assert.equal(summary.current, 27.5);
  assert.equal(summary.previous, 24.62);
  assert.equal(summary.difference, 27.5 - 24.62);
  assert.equal(summary.growthPercent, 11.7);
  assert.equal(summary.currentYearValue, 27.5);
});

void test('a refresh inserts new values, updates changed ones and deletes the missing', () => {
  const stored = [
    { ...ROWS[0]!, id: 'a' },
    { ...ROWS[1]!, id: 'b', value: 4.5 },
    { ...ROWS[2]!, id: 'c' },
    { ...ROWS[4]!, id: 'd', value: 9.00001 },
  ];
  const fresh = [ROWS[0]!, ROWS[1]!, ROWS[3]!, ROWS[4]!];

  assert.deepEqual(planRefresh(stored, fresh), {
    inserts: [ROWS[3]],
    updates: [{ id: 'b', value: 5, numerator: null, denominator: null }],
    deleteIds: ['c'],
  });
  assert.deepEqual(planRefresh([], []), { inserts: [], updates: [], deleteIds: [] });
});

void test('a refresh updates a rate whose parts changed even when its value did not', () => {
  const fresh = row(0, '2026-07-01', 'STORE_CONVERSION', null, 30, [600, 2000]);
  const stored = [{ ...row(0, '2026-07-01', 'STORE_CONVERSION', null, 30, [300, 1000]), id: 'a' }];

  assert.deepEqual(planRefresh(stored, [fresh]).updates, [
    { id: 'a', value: 30, numerator: 600, denominator: 2000 },
  ]);
  assert.deepEqual(planRefresh([{ ...fresh, id: 'a' }], [fresh]).updates, []);
});
