import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

import {
  MAX_TARGET_CHANGE_PERCENT,
  MIN_TARGET_CHANGE_PERCENT,
  TARGET_CHANGE_DECIMALS,
} from '../kpi-assignment-rules.js';

/**
 * `targetChangePercent` of the copy requests (template copy, bulk copy, period copy):
 * every copied target is changed by this percentage (ADR-070). Omitted means 0.
 */
export function TargetChangePercent(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      type: Number,
      minimum: MIN_TARGET_CHANGE_PERCENT,
      maximum: MAX_TARGET_CHANGE_PERCENT,
      default: 0,
      example: 10,
      description: `Kopyalanan hedeflerin yüzde değişimi; en fazla ${TARGET_CHANGE_DECIMALS} ondalık. \`10\` hedefleri %10 artırır, \`-10\` azaltır, \`0\` olduğu gibi kopyalar. Para ve adet hedefleri tam sayıya, yüzde hedefleri iki ondalığa yuvarlanır; yüzde hedefi 100'ü geçmez. Hedefi boş satır boş kalır.`,
    }),
    // JSON already carries a number; @Type(() => Number) would turn `null` into 0.
    IsOptional(),
    IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: TARGET_CHANGE_DECIMALS }),
    Min(MIN_TARGET_CHANGE_PERCENT),
    Max(MAX_TARGET_CHANGE_PERCENT),
  );
}
