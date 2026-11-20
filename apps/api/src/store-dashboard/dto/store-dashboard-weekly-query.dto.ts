import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

import { DASHBOARD_WEEK_COUNTS, DEFAULT_DASHBOARD_WEEKS } from '../store-dashboard-week-rules.js';

export class StoreDashboardWeeklyQueryDto {
  @ApiPropertyOptional({
    type: Number,
    enum: DASHBOARD_WEEK_COUNTS,
    example: DEFAULT_DASHBOARD_WEEKS,
    description:
      'Gösterilecek ve ortalaması alınacak bitmiş hafta sayısı; içinde bulunulan hafta ayrıca eklenir.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(DASHBOARD_WEEK_COUNTS)
  weeks?: number;
}
