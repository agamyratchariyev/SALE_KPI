export interface EmployeeAvatarResponse {
  bigImageUrl: string | null;
  blurhash: string | null;
  contentUrl: string;
  id: string;
  mediumImageUrl: string | null;
  smallImageUrl: string | null;
}

export interface EmployeeResponse {
  avatar: EmployeeAvatarResponse | null;
  createdAt: string;
  email: string | null;
  erpEmployeeId: number | null;
  erpEmployeeCode: string | null;
  firstname: string;
  fullAccess: boolean;
  /** May enter the daily store visitor counts (ADR-043). */
  canEnterVisitorCounts: boolean;
  id: string;
  isActive: boolean;
  lastname: string;
  phoneNumber: string | null;
  /** Required for new employees; `null` only on employees created before it (ADR-058). */
  jobTitle: string | null;
  /** Default store: a `GET /stores` id (ADR-058). */
  defaultStoreId: number | null;
  updatedAt: string;
  username: string;
}

/** The employee card (ADR-058), open to every signed-in user. */
export interface EmployeeCard {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar: EmployeeAvatarResponse | null;
  isActive: boolean;
  fullAccess: boolean;
  jobTitle: string | null;
  defaultStore: { id: number; nr: number | null; name: string | null } | null;
  /** Tiger sales rep code; the card's QR code. */
  erpEmployeeCode: string | null;
  /** Filled for `full_access` users and the employee themselves only. */
  email: string | null;
  phoneNumber: string | null;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  employee: EmployeeResponse;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface FileResponse {
  id: string;
  contentUrl: string;
  smallImageUrl: string | null;
  mediumImageUrl: string | null;
  bigImageUrl: string | null;
  blurhash: string | null;
}

export interface CreateEmployeeInput {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  jobTitle: string;
  defaultStoreId?: number | null;
  email?: string | null;
  phoneNumber?: string | null;
  erpEmployeeId?: number | null;
  avatarId?: string | null;
  fullAccess?: boolean;
  canEnterVisitorCounts?: boolean;
  isActive?: boolean;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface ErpEmployeeOption {
  id: number;
  code: string | null;
  name: string | null;
}

export interface EmployeeListResponse {
  items: EmployeeResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiErrorBody {
  message: string | string[];
  error?: string;
  statusCode: number;
  /** Business error code, e.g. `KPI_TEMPLATE_WEIGHT_TOTAL`; absent on DTO validation errors. */
  code?: string;
  totalWeight?: number;
  itemIndex?: number;
  duplicateOf?: number;
  path?: string;
  storeIds?: number[];
  /** `KPI_TEMPLATE_UNKNOWN_ITEM_GROUP`: item group codes that do not exist. */
  groupCodes?: string[];
  /** `STORE_VISITOR_COUNT_IMPORT_INVALID`: the wrong rows (first 100) and their total. */
  rows?: VisitorCountImportRowError[];
  errorCount?: number;
  /** `EMPLOYEE_SALARY_PERIOD_CLOSED`: closed months the change would alter. */
  months?: string[];
  /** 429 `AUTH_TOO_MANY_ATTEMPTS`: seconds until the next attempt is allowed. */
  retryAfterSeconds?: number;
  /** `KPI_TEMPLATE_IN_USE`: templates that KPI plans were built from. */
  templates?: KpiTemplateInUse[];
  /** `KPI_ASSIGNMENT_EXISTS` / `KPI_ASSIGNMENT_INELIGIBLE`: the employees involved. */
  employeeIds?: string[];
  employees?: { employeeId: string; reason: KpiPlanSkipReason }[];
}

export interface LocalizedText {
  tr: string;
  en?: string;
  ru?: string;
  tk?: string;
}

export type KpiScope = 'store' | 'employee';
export type KpiUnit = 'money' | 'count' | 'percent' | 'score';
export type KpiInputMode = 'calculated' | 'manual';

/** `stores`: values are `GET /stores` ids; `itemGroups`: values are item group codes (ADR-045). */
export type KpiLookupSource = 'stores' | 'itemGroups';

export interface KpiSelectOption {
  value: string;
  label: LocalizedText;
}

interface KpiInputFieldBase {
  key: string;
  label: LocalizedText;
  required: boolean;
}

export type KpiInputField =
  | (KpiInputFieldBase & { type: 'number'; min?: number; max?: number; decimals?: number })
  | (KpiInputFieldBase & { type: 'select'; multiple: boolean; options: KpiSelectOption[] })
  | (KpiInputFieldBase & { type: 'lookup'; multiple: boolean; source: KpiLookupSource })
  | (KpiInputFieldBase & { type: 'boolean' });

export interface KpiDefinition {
  id: string;
  code: string;
  name: LocalizedText;
  scope: KpiScope;
  unit: KpiUnit;
  inputMode: KpiInputMode;
  sortOrder: number;
  inputSchema: KpiInputField[];
}

export interface StoreOption {
  id: number;
  nr: number;
  name: string | null;
}

/** A Tiger item group (`STGRPCODE`) for item group KPIs (ADR-045). */
export interface ItemGroupOption {
  code: string;
  itemCount: number;
}

export interface ItemGroupListResponse {
  items: ItemGroupOption[];
  /** Share (%) of the last 12 months' net sales on items without a group; null without sales. */
  ungroupedSalesShare: number | null;
}

export type KpiInputValue = number | string | boolean | number[] | string[];

export interface KpiTemplateItem {
  id: string;
  kpiDefinitionId: string;
  definition: Pick<KpiDefinition, 'id' | 'code' | 'name' | 'scope' | 'unit' | 'inputMode'>;
  weight: number;
  targetValue: number | null;
  inputValues: Record<string, KpiInputValue>;
  sortOrder: number;
}

export interface KpiTemplate {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalWeight: number;
  items: KpiTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface KpiTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  itemCount: number;
  totalWeight: number;
  /** KPI plans built from the template, in every period; 0 when it was never used. */
  planCount: number;
  /** `YYYY-MM` of the newest period with such a plan; null when unused. */
  lastPeriod: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiTemplateListResponse {
  items: KpiTemplateSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Result of the bulk status endpoints: rows whose state actually changed (ADR-035). */
export interface BulkUpdateResponse {
  updated: number;
}

/** Result of a bulk delete: rows removed from the database (ADR-040). */
export interface BulkDeleteResponse {
  deleted: number;
}

/** A template that cannot be deleted because KPI plans were built from it. */
export interface KpiTemplateInUse {
  id: string;
  name: string;
  planCount: number;
}

export interface KpiTemplateCopyResult {
  sourceId: string;
  id: string;
  name: string;
}

export interface KpiTemplateBulkCopyResponse {
  copies: KpiTemplateCopyResult[];
}

export interface SaveKpiTemplateInput {
  name: string;
  description: string | null;
  isActive?: boolean;
  items: {
    kpiDefinitionId: string;
    weight: number;
    targetValue: number | null;
    inputValues: Record<string, KpiInputValue>;
  }[];
}

export type KpiPeriodStatus = 'open' | 'closed';

/** A monthly KPI period (ADR-039); plans and targets are written while it is open. */
export interface KpiPeriod {
  id: string;
  year: number;
  month: number;
  label: string;
  status: KpiPeriodStatus;
  closedAt: string | null;
  /** A closed period can be reopened until `reopenableUntil` (ADR-044). */
  canReopen: boolean;
  /** `YYYY-MM-DD`: the 10th day after the period's month ends. */
  reopenableUntil: string;
  assignmentCount: number;
  missingTargetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KpiPeriodListResponse {
  items: KpiPeriod[];
  total: number;
  page: number;
  limit: number;
}

export interface KpiPlanEmployee {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  isActive: boolean;
  erpEmployeeId: number | null;
  /** Small avatar, read with the Bearer token. */
  avatarUrl: string | null;
  jobTitle: string | null;
}

export interface KpiPlanItem {
  id: string;
  kpiDefinitionId: string;
  definition: Pick<KpiDefinition, 'id' | 'code' | 'name' | 'scope' | 'unit' | 'inputMode'>;
  weight: number;
  targetValue: number | null;
  inputValues: Record<string, KpiInputValue>;
  sortOrder: number;
  /** false: Tiger cannot measure this KPI, the actual value is typed in (ADR-041). */
  calculable: boolean;
}

/** One employee's plan in one period: the template's KPI rows with their own targets. */
export interface KpiPlan {
  id: string;
  period: Pick<KpiPeriod, 'id' | 'year' | 'month' | 'label' | 'status'>;
  employee: KpiPlanEmployee;
  templateId: string;
  templateName: string;
  totalWeight: number;
  items: KpiPlanItem[];
  totalScore: number | null;
  scoredItemCount: number | null;
  scoreCalculatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiPlanSummary {
  id: string;
  employee: KpiPlanEmployee;
  templateId: string;
  templateName: string;
  itemCount: number;
  targetCount: number;
  totalScore: number | null;
  scoredItemCount: number | null;
  scoreCalculatedAt: string | null;
  /** The salary in force in the plan's month and what the score earns; null without one. */
  salary: KpiPlanSalary | null;
  createdAt: string;
  updatedAt: string;
}

/** What the listed plans pay in one currency (ADR-067); TMT and USD are never added. */
export interface KpiPlanSalaryTotal {
  currency: SalaryCurrency;
  planCount: number;
  amount: number;
  fixedAmount: number;
  kpiAmount: number;
  /** A plan not calculated yet adds nothing here. */
  kpiEarned: number;
  totalEarned: number;
}

/** Every plan the search and filter keep, not only the loaded page (ADR-067). */
export interface KpiPlanSalarySummary {
  planCount: number;
  withoutSalaryCount: number;
  notCalculatedCount: number;
  totals: KpiPlanSalaryTotal[];
}

export interface KpiPlanListResponse {
  items: KpiPlanSummary[];
  total: number;
  page: number;
  limit: number;
  salarySummary: KpiPlanSalarySummary;
}

/** A period the signed-in employee has a plan in (`GET /kpi-assignments/me/periods`). */
export interface KpiMyPeriod {
  assignmentId: string;
  period: Pick<KpiPeriod, 'id' | 'year' | 'month' | 'label' | 'status'>;
  templateName: string;
  totalScore: number | null;
  scoreCalculatedAt: string | null;
  /** The month's salary and what the score earns of it; own plans or full_access only. */
  salary: KpiPlanSalary | null;
}

export interface KpiMyPeriodListResponse {
  items: KpiMyPeriod[];
  total: number;
  page: number;
  limit: number;
}

export type KpiPlanSkipReason = 'already-assigned' | 'inactive' | 'missing-erp-link';

export interface KpiPlanSkipped {
  employeeId: string;
  reason: KpiPlanSkipReason;
}

export interface KpiPlanCopyResult {
  created: number;
  skipped: KpiPlanSkipped[];
}

/** Target suggestion of a plan row, from the KPI report views (ADR-038). */
export interface KpiPlanRecommendation {
  itemId: string;
  monthCount: number;
  average: number | null;
  achievableMax: number | null;
  recommended: number | null;
  combined?: boolean;
}

export interface KpiPlanRecommendationsResponse {
  items: KpiPlanRecommendation[];
}

/** Where a result's actual value came from (ADR-041). */
export type KpiResultSource = 'calculated' | 'manual';

/** One plan row's result: what it achieved and the score it earned. */
export interface KpiResult {
  itemId: string;
  definition: Pick<KpiDefinition, 'id' | 'code' | 'name' | 'scope' | 'unit' | 'inputMode'>;
  weight: number;
  targetValue: number | null;
  actualValue: number | null;
  source: KpiResultSource;
  /** May pass 100 and may be negative; the score itself is capped at 100. */
  rawAchievement: number | null;
  cappedAchievement: number | null;
  weightedScore: number | null;
  calculatedAt: string | null;
  /** What this KPI is worth of the salary's KPI part (KPI part × weight / 100), ADR-049. */
  salaryValue: number | null;
  /** What it earned (KPI part × weighted score / 100); null when not scored. */
  salaryEarned: number | null;
  /** `STORE_CONVERSION` only: the days, receipts and visitors behind the value (ADR-052). */
  conversion: KpiConversionDetail | null;
}

export interface KpiConversionDetail {
  storeCount: number;
  countedDays: number;
  possibleDays: number;
  coverage: number;
  requiredCoverage: number;
  receipts: number;
  visitors: number;
  lastDay: string | null;
  gap?: 'no-days' | 'low-coverage' | 'no-visitors';
}

/** The salary of the plan's month and what the score earns of it (ADR-049). */
export interface KpiPlanSalary {
  effectiveMonth: string;
  amount: number;
  currency: SalaryCurrency;
  fixedPercent: number;
  kpiPercent: number;
  fixedAmount: number;
  kpiAmount: number;
  /** KPI part × total score / 100; null before the first calculation. */
  kpiEarned: number | null;
  /** Fixed part + earned KPI part; an interim figure while the period is open. */
  totalEarned: number | null;
}

export interface KpiPlanResults {
  assignmentId: string;
  totalScore: number | null;
  scoredItemCount: number;
  itemCount: number;
  calculatedAt: string | null;
  items: KpiResult[];
  /** Only the plan's owner and full_access users receive it; null when no salary applies. */
  salary: KpiPlanSalary | null;
}

export interface KpiPeriodCalculation {
  calculated: number;
  incomplete: number;
  calculatedAt: string;
}

export interface SaveKpiActualsInput {
  items: { id: string; actualValue: number | null }[];
}

export interface SaveKpiTargetsInput {
  items: { id: string; targetValue: number | null }[];
}

/** Tables whose screens show record info (ADR-036); the API accepts every audited table. */
/** One store's visitor count for one day (ADR-043). */
export interface StoreVisitorCount {
  id: string;
  storeId: number;
  /** Tiger store number and name; null when the store is gone from Tiger. */
  storeNr: number | null;
  storeName: string | null;
  /** `YYYY-MM-DD` */
  date: string;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreVisitorCountListResponse {
  items: StoreVisitorCount[];
  total: number;
  page: number;
  limit: number;
}

/** What an Excel import wrote (ADR-055). */
export interface StoreVisitorCountImportResult {
  created: number;
  updated: number;
  unchanged: number;
  /** Rows left without a count. */
  skipped: number;
}

export interface VisitorCountReportPeriod {
  from: string;
  to: string;
  visitors: number;
  countedStoreDays: number;
  possibleStoreDays: number;
  /** Per entered store-day; null without entries. */
  average: number | null;
}

/** Visitor count report of a date range (ADR-056). */
export interface VisitorCountReport {
  current: VisitorCountReportPeriod;
  previous: VisitorCountReportPeriod;
  averageChange: number | null;
  storeCount: number;
  busiestDay: { date: string; visitors: number } | null;
  days: { date: string; visitors: number | null; stores: number }[];
  /** ISO weekday 1 (Monday) … 7. */
  weekdays: { weekday: number; average: number | null; storeDays: number }[];
  stores: {
    storeId: number;
    storeNr: number;
    storeName: string | null;
    visitors: number;
    days: number;
    average: number | null;
  }[];
}

export type VisitorCountImportRowErrorCode =
  | 'INVALID_DATE'
  | 'FUTURE_DATE'
  | 'INVALID_STORE'
  | 'UNKNOWN_STORE'
  | 'INVALID_COUNT'
  | 'DUPLICATE'
  | 'CLOSED_PERIOD';

/** A wrong row of a rejected import; `row` is the Excel row number. */
export interface VisitorCountImportRowError {
  row: number;
  code: VisitorCountImportRowErrorCode;
}

export interface SaveStoreVisitorCountInput {
  storeId: number;
  date: string;
  visitorCount: number;
}

export type AuditedTable =
  | 'employees'
  | 'kpi_templates'
  | 'kpi_periods'
  | 'kpi_assignments'
  | 'kpi_results'
  | 'store_visitor_counts'
  | 'employee_salaries';

export interface AuditActor {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
}

/** `old` is missing for created rows, `new` for deleted ones; secrets only say `redacted`. */
export interface AuditFieldChange {
  old?: unknown;
  new?: unknown;
  redacted?: true;
}

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: string;
  /** `export`: the record was downloaded (Excel), nothing changed (ADR-059). */
  action: 'create' | 'update' | 'delete' | 'export';
  changes: Record<string, AuditFieldChange>;
  context: Record<string, unknown> | null;
  /** null: the system (migration, scheduled job). */
  actor: AuditActor | null;
  requestId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface RecordInfo {
  tableName: string;
  recordId: string;
  createdAt: string;
  createdBy: AuditActor | null;
  updatedAt: string;
  updatedBy: AuditActor | null;
}

/** A period as the leaderboard lists it. */
export type LeaderboardPeriod = Pick<KpiPeriod, 'id' | 'year' | 'month' | 'label' | 'status'>;

/** One plan on the leaderboard (ADR-047): who, which template, and the stored total score. */
export interface LeaderboardEntry {
  /** Equal scores share a rank; `null` when the plan was never calculated. */
  rank: number | null;
  assignmentId: string;
  employee: {
    id: string;
    firstname: string;
    lastname: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    defaultStoreId: number | null;
  };
  templateId: string;
  templateName: string;
  totalScore: number | null;
  scoredItemCount: number;
  itemCount: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod | null;
  /** Periods with at least one plan, newest first. */
  periods: LeaderboardPeriod[];
  templates: { id: string; name: string; planCount: number }[];
  /** Default stores of the period's employees (ADR-058); the store filter. */
  stores: { id: number; nr: number | null; name: string | null; planCount: number }[];
  calculatedAt: string | null;
  autoCalculation: {
    /** 0: the scheduled recalculation is off. */
    intervalMinutes: number;
    lastRunAt: string | null;
  };
  entries: LeaderboardEntry[];
}

export type SalaryCurrency = 'TMT' | 'USD';

/** A salary from a month on (ADR-048); in force until a newer one is entered. */
export interface EmployeeSalary {
  id: string;
  employeeId: string;
  /** `YYYY-MM`: the first month the salary applies to. */
  effectiveMonth: string;
  amount: number;
  currency: SalaryCurrency;
  fixedPercent: number;
  kpiPercent: number;
  fixedAmount: number;
  kpiAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryList {
  /** The salary in force this month, if any. */
  current: EmployeeSalary | null;
  /** Newest month first. */
  items: EmployeeSalary[];
}

export interface SaveEmployeeSalaryInput {
  effectiveMonth: string;
  amount: number;
  currency: SalaryCurrency;
  fixedPercent: number;
  kpiPercent: number;
}

/** Store dashboard (ADR-061): a calendar year against the year before. */
export type StoreDashboardMonthStatus = 'complete' | 'inProgress' | 'upcoming';

export interface StoreDashboardMonth {
  /** 1–12. */
  month: number;
  status: StoreDashboardMonthStatus;
  /** The selected year; null when the store had no sales documents that month. */
  current: number | null;
  previous: number | null;
  /** Only for a finished month with a positive value the year before. */
  growthPercent: number | null;
  /** The month before (January: December of the year before); only for a finished month. */
  previousMonth: number | null;
  /** Change from the month before; only for a finished month with a positive month before. */
  previousMonthGrowthPercent: number | null;
}

export interface StoreDashboardSummary {
  /** Finished months with values in both years; growth is measured over these. */
  comparableMonths: number[];
  current: number | null;
  previous: number | null;
  difference: number | null;
  growthPercent: number | null;
  currentYearValue: number | null;
  currentYearMonths: number;
  previousYearValue: number | null;
  previousYearMonths: number;
}

export interface StoreDashboardComparison {
  /** Tiger iş yeri number; null for all stores together. */
  storeNr: number | null;
  months: StoreDashboardMonth[];
  summary: StoreDashboardSummary;
}

export interface StoreDashboardSeries {
  /** Sales come in both currencies; the counts have none. */
  currency: 'TMT' | 'USD' | null;
  total: StoreDashboardComparison;
  /** Same order as `StoreDashboardResponse.stores`. */
  stores: StoreDashboardComparison[];
}

export interface StoreDashboardKpi {
  code: string;
  name: LocalizedText;
  unit: KpiUnit;
  /**
   * `average`: distinct per month, so a period shows the monthly average. `ratio`: a rate
   * (the conversion) whose parts are added up first, then divided.
   */
  aggregation: 'sum' | 'average' | 'ratio';
  series: StoreDashboardSeries[];
}

export interface StoreDashboardResponse {
  year: number;
  previousYear: number;
  /** Selectable years, newest first. */
  years: number[];
  /** `YYYY-MM`: the month in progress. */
  currentMonth: string;
  refresh: {
    /** 0: the scheduled refresh is off. */
    intervalMinutes: number;
    lastRunAt: string | null;
  };
  stores: { nr: number; name: string | null }[];
  kpis: StoreDashboardKpi[];
}
