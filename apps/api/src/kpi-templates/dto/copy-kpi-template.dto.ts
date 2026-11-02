import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { BulkIdsDto } from '../../common/dto/bulk.dto.js';
import { TargetChangePercent } from '../../kpi-assignments/dto/target-change-percent.js';

export class CopyKpiTemplateDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: 200,
    example: 'MÜDÜR KPI 02',
    description:
      'Kopyanın adı. Verilmezse kaynağın adına bir sonraki boş " (n)" eki getirilir (ör. `MÜDÜR KPI 01 (2)`).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  /** Applies to the template's default targets. */
  @TargetChangePercent()
  targetChangePercent?: number;
}

export class BulkCopyKpiTemplatesDto extends BulkIdsDto {
  @TargetChangePercent()
  targetChangePercent?: number;
}
