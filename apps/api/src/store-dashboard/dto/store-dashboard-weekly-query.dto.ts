import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  DEFAULT_DASHBOARD_WEEKS,
  MAX_DASHBOARD_WEEKS,
  MIN_DASHBOARD_WEEKS,
} from '../store-dashboard-week-rules.js';

export class StoreDashboardWeeklyQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: DEFAULT_DASHBOARD_WEEKS,
    minimum: MIN_DASHBOARD_WEEKS,
    maximum: MAX_DASHBOARD_WEEKS,
    description: 'Gösterilecek hafta sayısı; içinde bulunulan hafta dâhildir.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_DASHBOARD_WEEKS)
  @Max(MAX_DASHBOARD_WEEKS)
  weeks?: number;
}
