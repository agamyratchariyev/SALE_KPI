import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { RebuildKpiReportSharedCustomers1799705300000 } from '../database/migrations/1799705300000-rebuild-kpi-report-shared-customers.js';

const ENVIRONMENT = {
  FIRM_NR: '3',
  TIGER_PERIOD_NR: '1',
  TIGER_PERIOD_NRS: '',
  TIGER_SHARED_CUSTOMER_CODES: '120.99361279916',
};

interface RunOptions {
  environment?: Partial<typeof ENVIRONMENT>;
  /** Rows `dbo.kpi_results` answers with. */
  results?: unknown[];
}

async function run(
  step: 'up' | 'down',
  { environment = {}, results = [] }: RunOptions = {},
): Promise<{ statements: string[]; error: unknown }> {
  const values: Record<string, string> = { ...ENVIRONMENT, ...environment };
  const previous = Object.fromEntries(Object.keys(values).map((name) => [name, process.env[name]]));
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<unknown[]> {
      statements.push(sql);

      return Promise.resolve(sql.includes('[kpi_results]') ? results : []);
    },
  } as unknown as QueryRunner;
  let error: unknown = null;

  Object.assign(process.env, values);

  try {
    await new RebuildKpiReportSharedCustomers1799705300000()[step](queryRunner);
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
  return statements.find((sql) => sql.includes('VIEW [dbo].[kpi_report_settings]')) ?? '';
}

void test('rebuilds the settings view with the configured accounts, firm and periods', async () => {
  const { statements, error } = await run('up', {
    environment: {
      FIRM_NR: '7',
      TIGER_PERIOD_NR: '2',
      TIGER_PERIOD_NRS: '1,2',
      TIGER_SHARED_CUSTOMER_CODES: " 120.1 , O'NEIL,120.1",
    },
    results: [{ found: 1 }],
  });
  const view = settingsView(statements);

  assert.equal(error, null);
  assert.deepEqual(statements, [view]);
  assert.match(view, /CAST\(7 AS int\) AS \[firm_nr\]/);
  assert.match(view, /CAST\(N'120\.1,O''NEIL' AS nvarchar\(4000\)\) AS \[shared_customer_codes\]/);
  assert.match(view, /CAST\(N'1,2' AS nvarchar\(400\)\) AS \[period_nrs\]/);
});

void test('refuses an empty list once KPI results exist, without touching the view', async () => {
  const { statements, error } = await run('up', {
    environment: { TIGER_SHARED_CUSTOMER_CODES: ' , ' },
    results: [{ found: 1 }],
  });

  assert.match(String(error), /TIGER_SHARED_CUSTOMER_CODES is empty/);
  assert.equal(settingsView(statements), '');
});

void test('a new installation without results may have no shared account', async () => {
  const { statements, error } = await run('up', {
    environment: { TIGER_SHARED_CUSTOMER_CODES: '' },
  });

  assert.equal(error, null);
  assert.match(
    settingsView(statements),
    /CAST\(N'' AS nvarchar\(4000\)\) AS \[shared_customer_codes\]/,
  );
});

void test('never writes to the stored KPI results', async () => {
  for (const step of ['up', 'down'] as const) {
    const { statements } = await run(step, { results: [{ found: 1 }] });

    assert.ok(
      statements.every((sql) => !/\b(INSERT|UPDATE|DELETE|MERGE)\b/i.test(sql)),
      step,
    );
  }
});

void test('down restores the empty list and keeps firm and periods', async () => {
  const { statements, error } = await run('down');
  const view = settingsView(statements);

  assert.equal(error, null);
  assert.match(view, /CAST\(3 AS int\) AS \[firm_nr\]/);
  assert.match(view, /CAST\(N'' AS nvarchar\(4000\)\) AS \[shared_customer_codes\]/);
  assert.match(view, /CAST\(N'1' AS nvarchar\(400\)\) AS \[period_nrs\]/);
});
