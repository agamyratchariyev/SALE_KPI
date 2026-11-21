import { join } from 'node:path';

import type { DataSourceOptions } from 'typeorm';

import { AuditGuardSubscriber } from '../audit/audit-guard.subscriber.js';
import { AuditLogEntity } from '../audit/entities/audit-log.entity.js';
import { getKpiDatabaseConfig } from '../config/environment.js';
import { DeviceSessionEntity } from '../device-sessions/entities/device-session.entity.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { FileEntity } from '../files/entities/file.entity.js';
import { ItemGroupEntity } from '../item-groups/entities/item-group.entity.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiDefinitionEntity } from '../kpi-definitions/entities/kpi-definition.entity.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { KpiResultEntity } from '../kpi-results/entities/kpi-result.entity.js';
import { KpiTemplateItemEntity } from '../kpi-templates/entities/kpi-template-item.entity.js';
import { KpiTemplateEntity } from '../kpi-templates/entities/kpi-template.entity.js';
import { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import { StoreKpiMonthValueEntity } from '../store-dashboard/entities/store-kpi-month-value.entity.js';
import { StoreKpiWeekValueEntity } from '../store-dashboard/entities/store-kpi-week-value.entity.js';
import { StoreVisitorCountEntity } from '../store-visitor-counts/entities/store-visitor-count.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';

export function getKpiDataSourceOptions(): DataSourceOptions {
  const config = getKpiDatabaseConfig();

  return {
    type: 'mssql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [
      FileEntity,
      EmployeeEntity,
      DeviceSessionEntity,
      ErpEmployeeEntity,
      StoreEntity,
      ItemGroupEntity,
      KpiDefinitionEntity,
      KpiTemplateEntity,
      KpiTemplateItemEntity,
      KpiPeriodEntity,
      KpiResultEntity,
      KpiAssignmentEntity,
      KpiAssignmentItemEntity,
      StoreVisitorCountEntity,
      StoreKpiMonthValueEntity,
      StoreKpiWeekValueEntity,
      EmployeeSalaryEntity,
      AuditLogEntity,
    ],
    // Rejects writes to audited tables that bypass AuditService (ADR-036).
    subscribers: [AuditGuardSubscriber],
    migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
    migrationsRun: false,
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
      // Columns hold UTC. TypeORM defaults to useUTC: false, which reads and writes
      // datetime2 in the Node process's time zone: fine in the UTC container, 5 hours off
      // for scripts and `npm run dev` on an Asia/Ashgabat machine.
      useUTC: true,
    },
  };
}
