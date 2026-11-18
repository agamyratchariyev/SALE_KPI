import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiDefinitionEntity } from '../kpi-definitions/entities/kpi-definition.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { StoreKpiMonthValueEntity } from './entities/store-kpi-month-value.entity.js';
import { StoreKpiWeekValueEntity } from './entities/store-kpi-week-value.entity.js';
import { StoreDashboardRefreshService } from './store-dashboard-refresh.service.js';
import { StoreDashboardController } from './store-dashboard.controller.js';
import { StoreDashboardService } from './store-dashboard.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreKpiMonthValueEntity,
      StoreKpiWeekValueEntity,
      KpiDefinitionEntity,
      StoreEntity,
    ]),
    AuthModule,
  ],
  controllers: [StoreDashboardController],
  providers: [StoreDashboardService, StoreDashboardRefreshService],
})
export class StoreDashboardModule {}
