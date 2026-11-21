import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { RefreshKpiReportSharedCustomers1799705400000 } from '../database/migrations/1799705400000-refresh-kpi-report-shared-customers.js';

const ENVIRONMENT = {
  FIRM_NR: '3',
  TIGER_PERIOD_NR: '1',
  TIGER_PERIOD_NRS: '',
  TIGER_SHARED_CUSTOMER_CODES: 'A.1,B.2',
};

interface RunOptions {
  codes?: string;
  /** What `dbo.kpi_report_settings` holds now. */
  current?: string;
  /** Rows `dbo.kpi_results` answers with. */
  results?: unknown[];
}

async function run(
  step: 'up' | 'down',
  {
    codes = ENVIRONMENT.TIGER_SHARED_CUSTOMER_CODES,
    current = 'A.1',
    results = [{}],
  }: RunOptions = {},
): Promise<{ statements: string[]; error: unknown }> {
  const values: Record<string, string> = { ...ENVIRONMENT, TIGER_SHARED_CUSTOMER_CODES: codes };
  const previous = Object.fromEntries(Object.keys(values).map((name) => [name, process.env[name]]));
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<unknown[]> {
      statements.push(sql);

      if (sql.includes('[kpi_results]')) {
        return Promise.resolve(results);
      }

      return Promise.resolve(sql.startsWith('SELECT') ? [{ codes: current }] : []);
    },
  } as unknown as QueryRunner;
  let error: unknown = null;

  Object.assign(process.env, values);

  try {
    await new RefreshKpiReportSharedCustomers1799705400000()[step](queryRunner);
  } catch (caught: unknown) {
    error = caught;
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }

  return { statements, error };
}

function settingsView(statements: string[]): string {
  return statements.find((sql) => sql.includes('CREATE OR ALTER VIEW')) ?? '';
}

void test('rebuilds the settings view with the extended list', async () => {
  const { statements, error } = await run('up');
  const view = settingsView(statements);

  assert.equal(error, null);
  assert.match(view, /CAST\(3 AS int\) AS \[firm_nr\]/);
  assert.match(view, /CAST\(N'A\.1,B\.2' AS nvarchar\(4000\)\) AS \[shared_customer_codes\]/);
  assert.match(view, /CAST\(N'1' AS nvarchar\(400\)\) AS \[period_nrs\]/);
});

void test('refuses a list the view already holds, whatever its order', async () => {
  const { statements, error } = await run('up', { codes: 'B.2, A.1', current: 'A.1,B.2' });

  assert.match(String(error), /empty or already built/);
  assert.equal(settingsView(statements), '');
});

void test('refuses an empty list once KPI results exist', async () => {
  const { statements, error } = await run('up', { codes: ' , ' });

  assert.match(String(error), /empty or already built/);
  assert.equal(settingsView(statements), '');
});

void test('a new installation passes with an unchanged or empty list', async () => {
  for (const codes of ['A.1', '']) {
    const { statements, error } = await run('up', { codes, results: [] });

    assert.equal(error, null, codes);
    assert.notEqual(settingsView(statements), '', codes);
  }
});

void test('never writes to the stored KPI results', async () => {
  for (const step of ['up', 'down'] as const) {
    const { statements } = await run(step);

    assert.ok(
      statements.every((sql) => !/\b(INSERT|UPDATE|DELETE|MERGE)\b/i.test(sql)),
      step,
    );
  }
});

void test('down rebuilds the view from the restored environment list', async () => {
  const { statements, error } = await run('down', { codes: 'A.1' });

  assert.equal(error, null);
  assert.match(
    settingsView(statements),
    /CAST\(N'A\.1' AS nvarchar\(4000\)\) AS \[shared_customer_codes\]/,
  );
});
