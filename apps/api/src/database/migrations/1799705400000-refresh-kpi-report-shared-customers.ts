import type { MigrationInterface, QueryRunner } from 'typeorm';

import { getTigerPeriodNumbers, getTigerSharedCustomerCodes } from '../../config/environment.js';
import { TigerTables } from '../../tiger/tiger-tables.js';

// More shared cash accounts were identified in TIGER_SHARED_CUSTOMER_CODES (ADR-072). The codes
// stay in the environment: several look like phone numbers and never belong in the repository.
//
// Open periods pick the change up at their next calculation. Closed periods keep their stored
// results: nothing here touches kpi_results.
//
// SQL is inlined on purpose: a migration is a snapshot (ADR-038).

function quoteString(value: string): string {
  return `N'${value.replaceAll("'", "''")}'`;
}

function settingsViewSql(
  firm: number,
  sharedCustomerCodes: readonly string[],
  periods: readonly number[],
): string {
  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_settings]
    AS
    -- Tiger settings the report views were built with; schema-check compares them with .env.
    SELECT
      CAST(${firm} AS int) AS [firm_nr],
      CAST(${quoteString(sharedCustomerCodes.join(','))} AS nvarchar(4000)) AS [shared_customer_codes],
      CAST(${quoteString(periods.join(','))} AS nvarchar(400)) AS [period_nrs]
  `;
}

function normalized(codes: readonly string[]): string {
  return [...new Set(codes.map((code) => code.trim()).filter(Boolean))].sort().join(',');
}

export class RefreshKpiReportSharedCustomers1799705400000 implements MigrationInterface {
  name = 'RefreshKpiReportSharedCustomers1799705400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const codes = getTigerSharedCustomerCodes();
    const results = (await queryRunner.query(
      'SELECT TOP (1) 1 AS [found] FROM [dbo].[kpi_results]',
    )) as unknown[];

    // On a system in use, an empty or unchanged setting means this migration runs in the wrong
    // environment; it would be recorded as applied without adding the accounts (ADR-072).
    if (results.length > 0) {
      const rows = (await queryRunner.query(
        'SELECT [shared_customer_codes] AS [codes] FROM [dbo].[kpi_report_settings]',
      )) as Array<{ codes: string }>;
      const current = normalized((rows[0]?.codes ?? '').split(','));

      if (codes.length === 0 || normalized(codes) === current) {
        throw new Error(
          'TIGER_SHARED_CUSTOMER_CODES is empty or already built into dbo.kpi_report_settings. Set the new list in the environment this migration runs in, then run the migration again.',
        );
      }
    }

    await queryRunner.query(
      settingsViewSql(TigerTables.fromEnvironment().firm, codes, getTigerPeriodNumbers()),
    );
  }

  /** The earlier list is not kept here: restore it in the environment before reverting. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      settingsViewSql(
        TigerTables.fromEnvironment().firm,
        getTigerSharedCustomerCodes(),
        getTigerPeriodNumbers(),
      ),
    );
  }
}
