import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { BULK_MAX_IDS } from '../../common/dto/bulk.dto.js';
import { GUID_PATTERN } from '../../common/guid.js';
import { MAX_TARGET_DECIMALS, MAX_TARGET_VALUE } from '../kpi-assignment-rules.js';
import { TargetChangePercent } from './target-change-percent.js';

const toLowerCaseIds = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value)
    ? value.map((id: unknown) => (typeof id === 'string' ? id.toLowerCase() : id))
    : value;

export class AssignKpiTemplateDto {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_templates.id`; aktif olmalı.' })
  @Matches(GUID_PATTERN, { message: 'templateId must be a GUID' })
  templateId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    isArray: true,
    minItems: 1,
    maxItems: BULK_MAX_IDS,
    description: `Plan verilecek çalışanlar; 1–${BULK_MAX_IDS} arası, tekrarsız.`,
  })
  @Transform(toLowerCaseIds)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_MAX_IDS)
  @ArrayUnique()
  @Matches(GUID_PATTERN, { each: true, message: 'each value in employeeIds must be a GUID' })
  employeeIds: string[];
}

export class CopyKpiAssignmentsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Planları kopyalanacak dönem, genellikle önceki ay.',
  })
  @Matches(GUID_PATTERN, { message: 'sourcePeriodId must be a GUID' })
  sourcePeriodId: string;

  @TargetChangePercent()
  targetChangePercent?: number;
}

export class KpiTargetDto {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_assignment_items.id`' })
  @Matches(GUID_PATTERN, { message: 'id must be a GUID' })
  id: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    example: 347621,
    description: `En fazla ${MAX_TARGET_DECIMALS} ondalık; yüzde birimli KPI'da en fazla 100. \`null\` hedefi boşaltır.`,
  })
  // JSON already carries a number; @Type(() => Number) would turn `null` into 0.
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: MAX_TARGET_DECIMALS })
  @Min(0)
  @Max(MAX_TARGET_VALUE)
  targetValue: number | null;
}

export class SaveKpiTargetsDto {
  @ApiProperty({
    type: () => KpiTargetDto,
    isArray: true,
    minItems: 1,
    maxItems: 50,
    description: 'Yalnız gönderilen satırların hedefi yazılır.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => KpiTargetDto)
  items: KpiTargetDto[];
}
