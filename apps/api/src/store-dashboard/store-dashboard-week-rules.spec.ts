import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { AddStoreKpiWeekValues1799705200000 } from '../database/migrations/1799705200000-add-store-kpi-week-values.js';
import { planValueRefresh, type MonthAmount } from './store-dashboard-rules.js';
import {
  WEEK_REFRESH_WEEKS,
  addDays,
  compareWeeks,
  firstBaselineWeek,
  shownWeeks,
  weekDaysBefore,
  weekRefreshWindow,
  weekStartOf,
  weeklyValues,
  type StoreWeekValue,
} from './store-dashboard-week-rules.js';

function amounts(entries: [string, number][]): Map<string, MonthAmount> {
  return new Map(entries.map(([week, value]) => [week, { value, parts: null }]));
}

function row(overrides: Partial<StoreWeekValue>): StoreWeekValue {
  return {
    weekStart: '2026-11-09',
    storeNr: 0,
    kpiCode: 'STORE_SALES',
    currency: 'TMT',
    value: 100,
    numerator: null,
    denominator: null,
    ...overrides,
  };
}

void test('a week starts on Monday, also across a month and a year', () => {
  assert.equal(weekStartOf('2026-11-18'), '2026-11-16'); // Wednesday
  assert.equal(weekStartOf('2026-11-16'), '2026-11-16'); // Monday
  assert.equal(weekStartOf('2026-11-22'), '2026-11-16'); // Sunday
  assert.equal(weekStartOf('2026-11-01'), '2026-10-26');
  assert.equal(weekStartOf('2027-01-01'), '2026-12-28');
});

void test('adds days over month and leap year ends', () => {
  assert.equal(addDays('2026-10-26', 6), '2026-11-01');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
});

void test('a running week counts only the days before today', () => {
  assert.deepEqual(weekDaysBefore('2026-11-16', '2026-11-18'), ['2026-11-16', '2026-11-17']);
  assert.deepEqual(weekDaysBefore('2026-11-16', '2026-11-16'), []);
  assert.equal(weekDaysBefore('2026-11-09', '2026-11-18').length, 7);
});

void test('the refresh window ends with the running week and starts on a Monday', () => {
  const window = weekRefreshWindow('2026-11-18');

  assert.equal(window.lastWeek, '2026-11-16');
  assert.equal(window.before, '2026-11-23');
  assert.equal(weekStartOf(window.from), window.from);
  assert.equal(window.from, addDays('2026-11-16', -7 * (WEEK_REFRESH_WEEKS - 1)));
});

void test('shows the requested weeks and reaches back for their baseline', () => {
  const weeks = shownWeeks('2026-11-16', 4);

  assert.deepEqual(weeks, ['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16']);
  assert.equal(firstBaselineWeek(weeks), '2026-09-28');
});

void test('compares a finished week with the week and the four weeks before', () => {
  const values = amounts([
    ['2026-10-12', 54855],
    ['2026-10-19', 50296],
    ['2026-10-26', 40700],
    ['2026-11-02', 57750],
    ['2026-11-09', 56460],
  ]);
  const [week] = compareWeeks(values, ['2026-11-09'], '2026-11-16', 'sum');

  assert.equal(week?.weekEnd, '2026-11-15');
  assert.equal(week?.status, 'complete');
  assert.equal(week?.previousWeek, 57750);
  assert.equal(week?.previousWeekGrowthPercent, -2.2);
  assert.equal(week?.fourWeekAverage, 50900.25);
  assert.equal(week?.fourWeekGrowthPercent, 10.9);
});

void test('the running week is shown but not compared', () => {
  const values = amounts([
    ['2026-11-09', 100],
    ['2026-11-16', 20],
  ]);
  const [week] = compareWeeks(values, ['2026-11-16'], '2026-11-16', 'sum');

  assert.equal(week?.status, 'inProgress');
  assert.equal(week?.value, 20);
  assert.equal(week?.previousWeek, null);
  assert.equal(week?.previousWeekGrowthPercent, null);
  assert.equal(week?.fourWeekAverage, null);
});

void test('a gap in the four weeks leaves no baseline, the week before still compares', () => {
  const values = amounts([
    ['2026-10-12', 10],
    ['2026-10-26', 10],
    ['2026-11-02', 10],
    ['2026-11-09', 20],
  ]);
  const [week] = compareWeeks(values, ['2026-11-09'], '2026-11-16', 'sum');

  assert.equal(week?.fourWeekAverage, null);
  assert.equal(week?.fourWeekGrowthPercent, null);
  assert.equal(week?.previousWeekGrowthPercent, 100);
});

void test('a rate baseline adds receipts and visitors before dividing', () => {
  const rate = (numerator: number, denominator: number): MonthAmount => ({
    value: (numerator / denominator) * 100,
    parts: { numerator, denominator },
  });
  const values = new Map<string, MonthAmount>([
    ['2026-10-12', rate(10, 100)],
    ['2026-10-19', rate(10, 100)],
    ['2026-10-26', rate(10, 100)],
    ['2026-11-02', rate(90, 100)],
    ['2026-11-09', rate(30, 100)],
  ]);
  const [week] = compareWeeks(values, ['2026-11-09'], '2026-11-16', 'ratio');

  assert.equal(week?.fourWeekAverage, 30);
  assert.equal(week?.fourWeekGrowthPercent, 0);
});

void test('adds stores together and keeps the currencies apart', () => {
  const rows = [
    row({ storeNr: 0, value: 100 }),
    row({ storeNr: 5, value: 40 }),
    row({ storeNr: 5, value: 7, currency: 'USD' }),
  ];

  assert.equal(weeklyValues(rows, 'STORE_SALES', 'TMT', null, 'sum').get('2026-11-09')?.value, 140);
  assert.equal(weeklyValues(rows, 'STORE_SALES', 'TMT', 5, 'sum').get('2026-11-09')?.value, 40);
  assert.equal(weeklyValues(rows, 'STORE_SALES', 'USD', null, 'sum').get('2026-11-09')?.value, 7);
});

void test('a refresh writes only what changed, week by week', () => {
  const stored = [
    { ...row({ value: 100 }), id: 'same' },
    { ...row({ weekStart: '2026-11-02', value: 50 }), id: 'changed' },
    { ...row({ weekStart: '2026-10-26', value: 9 }), id: 'gone' },
  ];
  const plan = planValueRefresh<StoreWeekValue>(
    stored,
    [
      row({ value: 100 }),
      row({ weekStart: '2026-11-02', value: 60 }),
      row({ weekStart: '2026-11-16', value: 1 }),
    ],
    (value) => value.weekStart,
  );

  assert.deepEqual(
    plan.inserts.map((value) => value.weekStart),
    ['2026-11-16'],
  );
  assert.deepEqual(plan.updates, [
    { id: 'changed', value: 60, numerator: null, denominator: null },
  ]);
  assert.deepEqual(plan.deleteIds, ['gone']);
});

async function migrationStatements(step: 'up' | 'down'): Promise<string[]> {
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<void> {
      statements.push(sql);

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new AddStoreKpiWeekValues1799705200000()[step](queryRunner);

  return statements;
}

void test('the migration creates the audited table and the week function', async () => {
  const sql = (await migrationStatements('up')).join('\n');

  assert.match(
    sql,
    /CREATE FUNCTION \[dbo\]\.\[kpi_store_week_values\] \(@from date, @before date\)/,
  );
  assert.match(sql, /FROM \[dbo\]\.\[kpi_report_documents\] d/);
  assert.match(sql, /N'STORE_VISITOR_COUNT'/);
  assert.match(sql, /CREATE TABLE \[dbo\]\.\[store_kpi_week_values\]/);
  assert.match(sql, /CK_store_kpi_week_values_week_start/);

  for (const column of ['created_at', 'created_by', 'updated_at', 'updated_by']) {
    assert.match(sql, new RegExp(`\\[${column}\\]`));
  }

  assert.match(sql, /FK_store_kpi_week_values_created_by/);
  assert.match(sql, /FK_store_kpi_week_values_updated_by/);
});

void test('the migration measures every weekly KPI the function has to give', async () => {
  const [functionSql = ''] = await migrationStatements('up');

  for (const code of [
    'STORE_SALES',
    'STORE_RECEIPTS',
    'STORE_CUSTOMERS',
    'STORE_NEW_CUSTOMERS',
    'STORE_RETURNING_CUSTOMERS',
    'STORE_PRODUCT_VARIETY',
    'STORE_VISITOR_COUNT',
  ]) {
    assert.ok(functionSql.includes(`N'${code}'`), code);
  }
});

void test('reverting removes the table and the function', async () => {
  assert.deepEqual(await migrationStatements('down'), [
    'DROP TABLE [dbo].[store_kpi_week_values]',
    'DROP FUNCTION [dbo].[kpi_store_week_values]',
  ]);
});
