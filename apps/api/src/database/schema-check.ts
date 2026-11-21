import '../config/load-environment.js';
import 'reflect-metadata';

import { DataSource } from 'typeorm';

import {
  getFirmNumber,
  getTigerDatabaseConfig,
  getTigerPeriodNumbers,
  getTigerSharedCustomerCodes,
} from '../config/environment.js';
import {
  compareReportSource,
  KPI_CONVERSION_REPORT_OBJECTS,
  KPI_GROUP_REPORT_OBJECTS,
  KPI_REPORT_OBJECTS,
  KPI_VISITOR_COUNT_REPORT_OBJECTS,
  readReportSource,
} from '../reports/kpi-report-checks.js';
import {
  findStaleReferences,
  findTigerWriteRights,
  findUnknownCustomerCodes,
  findViewSourceMismatches,
  readTigerPeriod,
} from '../tiger/tiger-checks.js';
import { getTigerDataSourceOptions } from '../tiger/tiger-data-source.options.js';
import { TigerTables } from '../tiger/tiger-tables.js';
import dataSource from './data-source.js';

const REQUIRED_OBJECTS = [
  { name: 'dbo.files', type: 'U' },
  { name: 'dbo.employees', type: 'U' },
  { name: 'dbo.device_sessions', type: 'U' },
  { name: 'dbo.kpi_definitions', type: 'U' },
  { name: 'dbo.kpi_templates', type: 'U' },
  { name: 'dbo.kpi_template_items', type: 'U' },
  { name: 'dbo.kpi_periods', type: 'U' },
  { name: 'dbo.kpi_assignments', type: 'U' },
  { name: 'dbo.kpi_assignment_items', type: 'U' },
  { name: 'dbo.kpi_results', type: 'U' },
  // The month the results are calculated from (ADR-041); an inline table-valued function.
  { name: 'dbo.kpi_month_values', type: 'IF' },
  // Daily store visitor counts, the conversion KPI's denominator (ADR-043).
  { name: 'dbo.store_visitor_counts', type: 'U' },
  { name: 'dbo.store_kpi_month_values', type: 'U' },
  // Weekly store values and the function that measures them (ADR-071).
  { name: 'dbo.store_kpi_week_values', type: 'U' },
  { name: 'dbo.kpi_store_week_values', type: 'IF' },
  { name: 'dbo.employee_salaries', type: 'U' },
  { name: 'dbo.audit_logs', type: 'U' },
  { name: 'dbo.stores', type: 'V' },
  { name: 'dbo.erp_employees', type: 'V' },
  // KPI report views with their Tiger synonyms and helpers (ADR-038).
  ...KPI_REPORT_OBJECTS,
  // Item group sales: item cards, group list, group reports and month function (ADR-045).
  ...KPI_GROUP_REPORT_OBJECTS,
  // Store conversion target report (ADR-057).
  ...KPI_CONVERSION_REPORT_OBJECTS,
  // Store visitor count: monthly view, month function and target report (ADR-064).
  ...KPI_VISITOR_COUNT_REPORT_OBJECTS,
] as const;

async function objectExists(name: string, type: string): Promise<boolean> {
  const rows = await dataSource.query<Array<{ object_id: number | null }>>(
    'SELECT OBJECT_ID(@0, @1) AS [object_id]',
    [name, type],
  );

  return rows[0]?.object_id !== null && rows[0]?.object_id !== undefined;
}

/** Tables without the record trail columns: audit_logs is append-only (created_* only). */
const AUDIT_COLUMN_EXEMPT_TABLES = ['typeorm_migrations', 'audit_logs'];
const AUDIT_COLUMNS = ['created_at', 'created_by', 'updated_at', 'updated_by'];

/**
 * Every table we own must carry the record trail columns (ADR-036). Checking the live
 * schema catches a new table whose migration forgot them.
 */
async function getTablesMissingAuditColumns(): Promise<string[]> {
  const rows = await dataSource.query<Array<{ table_name: string; audit_columns: number }>>(
    `
      SELECT t.[name] AS [table_name], COUNT(c.[name]) AS [audit_columns]
      FROM sys.tables t
      JOIN sys.schemas s ON s.[schema_id] = t.[schema_id]
      LEFT JOIN sys.columns c
        ON c.[object_id] = t.[object_id]
        AND c.[name] IN (@0, @1, @2, @3)
      WHERE s.[name] = N'dbo'
      GROUP BY t.[name]
    `,
    AUDIT_COLUMNS,
  );

  return rows
    .filter(
      (row) =>
        !AUDIT_COLUMN_EXEMPT_TABLES.includes(row.table_name) &&
        Number(row.audit_columns) !== AUDIT_COLUMNS.length,
    )
    .map((row) => `dbo.${row.table_name}`);
}

async function getPendingMigrationNames(): Promise<string[]> {
  const configuredNames = dataSource.migrations.map((migration) => {
    if (!migration.name) {
      throw new Error('Every configured migration must have a name.');
    }

    return migration.name;
  });

  if (!(await objectExists('dbo.typeorm_migrations', 'U'))) {
    return configuredNames;
  }

  const executed = await dataSource.query<Array<{ name: string }>>(
    'SELECT [name] FROM [dbo].[typeorm_migrations]',
  );
  const executedNames = new Set(executed.map((migration) => migration.name));

  return configuredNames.filter((name) => !executedNames.has(name));
}

/**
 * The Tiger source (ADR-037): views and settings must name the same company, and the
 * configured firm/period must exist. Risky but workable states are printed as warnings.
 */
async function checkTigerSource(): Promise<void> {
  const tigerDatabase = getTigerDatabaseConfig().database;
  const tables = TigerTables.fromEnvironment();
  const mismatches = await findViewSourceMismatches(dataSource, tigerDatabase);

  if (mismatches.length > 0) {
    throw new Error(
      `${mismatches.join('; ')}, but TIGER_DB_NAME is ${tigerDatabase}. Fix TIGER_DB_NAME, or recreate the views for the new database with a migration.`,
    );
  }

  // The KPI report views were built for one database, firm and period (ADR-038).
  const reportSource = compareReportSource(await readReportSource(dataSource), {
    database: tigerDatabase,
    tables,
    sharedCustomerCodes: getTigerSharedCustomerCodes(),
    periods: getTigerPeriodNumbers(),
  });

  if (reportSource.errors.length > 0) {
    throw new Error(
      `KPI report views read another Tiger source: ${reportSource.errors.join('; ')}. Recreate the report synonyms and settings for the configured source with a migration (docs/REPORTS.md).`,
    );
  }

  for (const warning of reportSource.warnings) {
    console.warn(`WARNING: ${warning}.`);
  }

  // Sales of items without a group code count in no item group KPI (ADR-045).
  const [coverage] = await dataSource.query<Array<{ share: number | string | null }>>(
    'SELECT [ungrouped_share] AS [share] FROM [dbo].[item_group_coverage]',
  );

  if (coverage?.share !== null && coverage?.share !== undefined && Number(coverage.share) > 0) {
    console.warn(
      `WARNING: ${Number(coverage.share).toFixed(2)}% of the last 12 months' net sales are on items without a group code (STGRPCODE); they count in no *_GROUP_SALES KPI. Give the item cards a group in Tiger.`,
    );
  }

  const tiger = new DataSource(getTigerDataSourceOptions());
  await tiger.initialize();

  try {
    const period = await readTigerPeriod(tiger, tables);
    console.log(
      `Tiger source: ${tigerDatabase}, firm ${tables.firm}, period ${tables.period} (${formatDay(period.beginDate)} → ${formatDay(period.endDate)}).`,
    );

    // Every other period the KPI views read must exist too (ADR-054).
    for (const other of getTigerPeriodNumbers().filter((nr) => nr !== tables.period)) {
      const earlier = await readTigerPeriod(tiger, new TigerTables(tables.firm, other));
      console.log(
        `KPI views also read period ${other} (${formatDay(earlier.beginDate)} → ${formatDay(earlier.endDate)}).`,
      );
    }

    const sharedCodes = getTigerSharedCustomerCodes();

    if (sharedCodes.length === 0) {
      console.warn(
        'WARNING: TIGER_SHARED_CUSTOMER_CODES is empty, so customer KPIs count shared cash accounts as customers (business decision 17).',
      );
    } else {
      console.log(`Shared cash accounts left out of customer KPIs: ${sharedCodes.join(', ')}.`);
      const unknown = await findUnknownCustomerCodes(tiger, tables, sharedCodes);

      if (unknown.length > 0) {
        console.warn(
          `WARNING: TIGER_SHARED_CUSTOMER_CODES lists codes that are not customers of firm ${tables.firm}: ${unknown.join(', ')}.`,
        );
      }
    }

    const writeRights = await findTigerWriteRights(tiger);

    if (writeRights.length > 0) {
      console.warn(
        `WARNING: the Tiger account (TIGER_DB_USER) can write to ${tigerDatabase} (${writeRights.join(', ')}). Use a db_datareader-only login; see docs/TIGER_DATA.md.`,
      );
    }
  } finally {
    await tiger.destroy();
  }

  const stale = await findStaleReferences(dataSource, tables.firm);

  if (stale.templateStores.length > 0) {
    const byTemplate = new Map<string, Set<string>>();

    for (const row of stale.templateStores) {
      byTemplate.set(row.template, (byTemplate.get(row.template) ?? new Set()).add(row.storeId));
    }

    console.warn(
      `WARNING: ${stale.templateStores.length} KPI template row(s) select stores that are not workplaces of firm ${tables.firm}: ${[
        ...byTemplate,
      ]
        .map(([template, storeIds]) => `${template} (store ${[...storeIds].join(', ')})`)
        .join('; ')}. Re-select the stores in the template form.`,
    );
  }

  if (stale.employees.length > 0) {
    console.warn(
      `WARNING: ${stale.employees.length} employee(s) are linked to salespeople outside firm ${tables.firm}: ${stale.employees
        .map((row) => `${row.username} → ${row.erpEmployeeId}`)
        .join('; ')}. Re-select the ERP salesperson in the employee form.`,
    );
  }
}

function formatDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function checkSchema(): Promise<void> {
  getFirmNumber();
  await dataSource.initialize();

  try {
    const pendingMigrations = await getPendingMigrationNames();

    if (pendingMigrations.length > 0) {
      throw new Error(
        `Pending KPI_DB migrations found (${pendingMigrations.join(', ')}). Run: npm run migration:run`,
      );
    }

    const missing: string[] = [];

    for (const object of REQUIRED_OBJECTS) {
      if (!(await objectExists(object.name, object.type))) {
        missing.push(object.name);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Required KPI_DB tables/views are missing: ${missing.join(', ')}`);
    }

    const withoutAuditColumns = await getTablesMissingAuditColumns();

    if (withoutAuditColumns.length > 0) {
      throw new Error(
        `Tables without ${AUDIT_COLUMNS.join('/')} columns (ADR-036): ${withoutAuditColumns.join(', ')}`,
      );
    }

    console.log('KPI_DB migration, required table/view and audit column checks passed.');

    await checkTigerSource();
    console.log('Tiger source checks passed.');
  } finally {
    await dataSource.destroy();
  }
}

checkSchema().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Schema check failed: ${message}`);
  process.exitCode = 1;
});
