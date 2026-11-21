import type { MigrationInterface, QueryRunner } from 'typeorm';

// Weekly store KPI values for the store dashboard (ADR-071). Weeks run Monday to Sunday and
// are analysis only: the official KPI period stays the month (docs/BUSINESS_RULES.md).
//
// dbo.kpi_store_week_values measures a week from dbo.kpi_report_documents, the same view the
// month function reads, so the rules of docs/TIGER_DATA.md keep a single implementation. The
// visitor counts add up like the month's (ADR-064). A scheduled job copies the result into
// store_kpi_week_values, because a dashboard request must not compute from Tiger (ADR-010).
// The conversion (#7) is measured by that job with the calculation's rules (ADR-052).

/** Kept in step with the month function; migrations stay self-contained, so these repeat. */
const MEASURES = [
  { measure: 'SALES', currency: "N'TMT'", column: 'sales_tmt' },
  { measure: 'SALES', currency: "N'USD'", column: 'sales_usd' },
  { measure: 'RECEIPTS', currency: 'NULL', column: 'receipts' },
  { measure: 'CUSTOMERS', currency: 'NULL', column: 'customers' },
  { measure: 'NEW_CUSTOMERS', currency: 'NULL', column: 'new_customers' },
  { measure: 'RETURNING_CUSTOMERS', currency: 'NULL', column: 'returning_customers' },
  { measure: 'PRODUCT_VARIETY', currency: 'NULL', column: 'product_variety' },
] as const;

/** The Monday of a date's week: 1900-01-01 was a Monday, whatever DATEFIRST says. */
function mondayOf(column: string): string {
  return `DATEADD(day, -(DATEDIFF(day, CONVERT(date, '19000101', 112), ${column}) % 7), ${column})`;
}

function weekValuesFunctionSql(): string {
  const branches = MEASURES.map(
    ({ measure, currency, column }) => `
      SELECT
        w.[week_start],
        CAST(N'STORE_${measure}' AS nvarchar(64)) AS [kpi_code],
        CAST(w.[store_nr] AS int) AS [store_nr],
        CAST(${currency} AS nvarchar(3)) AS [currency],
        CAST(w.[${column}] AS decimal(19, 4)) AS [value]
      FROM [week_values] w`,
  );

  return `
    CREATE FUNCTION [dbo].[kpi_store_week_values] (@from date, @before date)
    RETURNS TABLE
    AS
    -- What every store did in each Monday-to-Sunday week of [@from, @before). @from must be a
    -- Monday, or its week comes out partial. Customers and product variety are distinct per
    -- week, so weeks do not add up to the month's value.
    RETURN
    (
      WITH [documents] AS (
        SELECT
          d.[invoice_ref],
          d.[trcode],
          d.[store_nr],
          d.[customer_ref],
          d.[receipts],
          d.[sales_tmt],
          d.[sales_usd],
          d.[is_first_purchase],
          d.[is_returning_visit],
          ${mondayOf('d.[sale_date]')} AS [week_start]
        FROM [dbo].[kpi_report_documents] d
        WHERE d.[sale_date] >= @from AND d.[sale_date] < @before
      ),
      [totals] AS (
        SELECT
          d.[week_start],
          d.[store_nr],
          SUM(d.[sales_tmt]) AS [sales_tmt],
          SUM(d.[sales_usd]) AS [sales_usd],
          SUM(d.[receipts]) AS [receipts],
          COUNT(DISTINCT d.[customer_ref]) AS [customers],
          COUNT(DISTINCT CASE WHEN d.[is_first_purchase] = 1 THEN d.[customer_ref] END) AS [new_customers],
          COUNT(DISTINCT CASE WHEN d.[is_returning_visit] = 1 THEN d.[customer_ref] END) AS [returning_customers]
        FROM [documents] d
        GROUP BY d.[week_start], d.[store_nr]
      ),
      [variety] AS (
        SELECT d.[week_start], d.[store_nr], COUNT(DISTINCT l.[STOCKREF]) AS [product_variety]
        FROM [documents] d
        JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = d.[invoice_ref]
        WHERE d.[trcode] = 7 AND l.[LINETYPE] = 0
        GROUP BY d.[week_start], d.[store_nr]
      ),
      [week_values] AS (
        SELECT
          t.[week_start],
          t.[store_nr],
          t.[sales_tmt],
          t.[sales_usd],
          t.[receipts],
          t.[customers],
          t.[new_customers],
          t.[returning_customers],
          ISNULL(v.[product_variety], 0) AS [product_variety]
        FROM [totals] t
        LEFT JOIN [variety] v
          ON v.[week_start] = t.[week_start] AND v.[store_nr] = t.[store_nr]
      )
      ${branches.join('\n      UNION ALL')}
      UNION ALL
      SELECT
        ${mondayOf('c.[visit_date]')} AS [week_start],
        CAST(N'STORE_VISITOR_COUNT' AS nvarchar(64)) AS [kpi_code],
        CAST(s.[nr] AS int) AS [store_nr],
        CAST(NULL AS nvarchar(3)) AS [currency],
        CAST(SUM(CAST(c.[visitor_count] AS bigint)) AS decimal(19, 4)) AS [value]
      FROM [dbo].[store_visitor_counts] c
      JOIN [dbo].[stores] s ON s.[id] = c.[store_id]
      JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
      WHERE c.[visit_date] >= @from AND c.[visit_date] < @before
      GROUP BY ${mondayOf('c.[visit_date]')}, s.[nr]
    )
  `;
}

export class AddStoreKpiWeekValues1799705200000 implements MigrationInterface {
  name = 'AddStoreKpiWeekValues1799705200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(weekValuesFunctionSql());

    await queryRunner.query(`
      CREATE TABLE [dbo].[store_kpi_week_values] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_store_kpi_week_values_id] DEFAULT NEWSEQUENTIALID(),
        [firm_nr] int NOT NULL,
        [store_nr] int NOT NULL,
        [week_start] date NOT NULL,
        [kpi_code] nvarchar(64) NOT NULL,
        [currency] nvarchar(3) NULL,
        [value] decimal(19, 4) NOT NULL,
        [numerator] decimal(19, 4) NULL,
        [denominator] decimal(19, 4) NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_store_kpi_week_values_created_at] DEFAULT SYSUTCDATETIME(),
        [created_by] uniqueidentifier NULL,
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_store_kpi_week_values_updated_at] DEFAULT SYSUTCDATETIME(),
        [updated_by] uniqueidentifier NULL,
        CONSTRAINT [PK_store_kpi_week_values] PRIMARY KEY ([id]),
        CONSTRAINT [FK_store_kpi_week_values_created_by]
          FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_store_kpi_week_values_updated_by]
          FOREIGN KEY ([updated_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [CK_store_kpi_week_values_week_start]
          CHECK (DATEDIFF(day, CONVERT(date, '19000101', 112), [week_start]) % 7 = 0),
        CONSTRAINT [CK_store_kpi_week_values_currency]
          CHECK ([currency] IS NULL OR [currency] IN (N'TMT', N'USD')),
        CONSTRAINT [CK_store_kpi_week_values_parts] CHECK (
          ([numerator] IS NULL AND [denominator] IS NULL)
          OR ([numerator] IS NOT NULL AND [denominator] > 0)
        )
      )
    `);

    // One value per firm, store, week, KPI and currency; SQL Server treats the NULL currency
    // of the non-money KPIs as one value, so they are unique too.
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_store_kpi_week_values_key]
      ON [dbo].[store_kpi_week_values] ([firm_nr], [week_start], [store_nr], [kpi_code], [currency])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [dbo].[store_kpi_week_values]`);
    await queryRunner.query(`DROP FUNCTION [dbo].[kpi_store_week_values]`);
  }
}
