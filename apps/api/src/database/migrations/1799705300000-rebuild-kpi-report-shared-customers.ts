import type { MigrationInterface, QueryRunner } from 'typeorm';

import { getTigerPeriodNumbers, getTigerSharedCustomerCodes } from '../../config/environment.js';
import { TigerTables } from '../../tiger/tiger-tables.js';

// No customer KPI counts a shared cash account (business decision 17). The views learn the
// accounts from dbo.kpi_report_settings, which only a migration writes, from
// TIGER_SHARED_CUSTOMER_CODES as it is when the migration runs. KPI_DB was built while that
// setting was empty, so the list stayed empty and the account was counted as a customer
// (ADR-072). This migration rebuilds the view from the current setting.
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

export class RebuildKpiReportSharedCustomers1799705300000 implements MigrationInterface {
  name = 'RebuildKpiReportSharedCustomers1799705300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const codes = getTigerSharedCustomerCodes();

    // An empty setting here would record this fix as applied while changing nothing, which is
    // how the list got lost. A new installation has no results yet and may have no such account.
    if (codes.length === 0) {
      const results = (await queryRunner.query(
        'SELECT TOP (1) 1 AS [found] FROM [dbo].[kpi_results]',
      )) as unknown[];

      if (results.length > 0) {
        throw new Error(
          'TIGER_SHARED_CUSTOMER_CODES is empty, but KPI results already exist. Set it in the environment this migration runs in, then run the migration again.',
        );
      }
    }

    await queryRunner.query(
      settingsViewSql(TigerTables.fromEnvironment().firm, codes, getTigerPeriodNumbers()),
    );
  }

  /** Back to the list this migration replaced, which was empty. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      settingsViewSql(TigerTables.fromEnvironment().firm, [], getTigerPeriodNumbers()),
    );
  }
}
