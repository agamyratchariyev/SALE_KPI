import { ApiProperty } from '@nestjs/swagger';

import { LocalizedTextResponse } from '../kpi-definitions/kpi-definition-response.js';
import { KPI_UNITS, type KpiUnit } from '../kpi-definitions/kpi-definition.types.js';
import {
  MONTH_STATUSES,
  STORE_DASHBOARD_AGGREGATIONS,
  type MonthStatus,
  type StoreDashboardAggregation,
} from './store-dashboard-rules.js';

export class StoreDashboardMonthResponse {
  @ApiProperty({ type: Number, example: 3, description: '1–12.' })
  month: number;

  @ApiProperty({
    type: String,
    enum: MONTH_STATUSES,
    description:
      '`complete` bitmiş ay, `inProgress` içinde bulunulan ay (karşılaştırılmaz), `upcoming` henüz gelmemiş ay.',
  })
  status: MonthStatus;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 362482.5,
    description:
      "Seçilen yılın ay değeri; o ay satış/iade belgesi (ziyaretçi KPI'larında sayılmış ziyaretçi) yoksa `null`.",
  })
  current: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Bir önceki yılın aynı ayı.' })
  previous: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 12.4,
    description: 'Yüzde değişim, bir ondalık. Yalnız bitmiş ve geçen yılı pozitif olan ayda dolu.',
  })
  growthPercent: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 178969,
    description:
      'Bir önceki ayın değeri (Ocak için önceki yılın Aralık ayı). Yalnız bitmiş ayda dolu.',
  })
  previousMonth: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 76.9,
    description:
      'Önceki aya göre yüzde değişim, bir ondalık. Yalnız bitmiş ve önceki ayı pozitif olan ayda dolu.',
  })
  previousMonthGrowthPercent: number | null;
}

export class StoreDashboardSummaryResponse {
  @ApiProperty({
    type: Number,
    isArray: true,
    example: [3, 4, 5, 6, 7, 8],
    description: 'İki yılda da değeri olan bitmiş aylar; artış bu aylar üzerinden ölçülür.',
  })
  comparableMonths: number[];

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Seçilen yılın karşılaştırılan aylardaki toplamı (`aggregation = sum`) ya da aylık ortalaması (`average`).',
  })
  current: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Bir önceki yılın aynı aylardaki değeri.',
  })
  previous: number | null;

  @ApiProperty({ type: Number, nullable: true, description: '`current − previous`.' })
  difference: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 8.3, description: 'Yüzde, bir ondalık.' })
  growthPercent: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Seçilen yılın değeri olan bütün bitmiş ayları (geçen yılla eşleşmese de).',
  })
  currentYearValue: number | null;

  @ApiProperty({ type: Number, example: 6 })
  currentYearMonths: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Bir önceki yılın değeri olan bütün ayları.',
  })
  previousYearValue: number | null;

  @ApiProperty({ type: Number, example: 0 })
  previousYearMonths: number;
}

export class StoreDashboardComparisonResponse {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 0,
    description: 'İş yeri numarası (`INVOICE.BRANCH`); `null` bütün mağazaların toplamıdır.',
  })
  storeNr: number | null;

  @ApiProperty({
    type: () => StoreDashboardMonthResponse,
    isArray: true,
    description: 'Her zaman 12 ay.',
  })
  months: StoreDashboardMonthResponse[];

  @ApiProperty({ type: () => StoreDashboardSummaryResponse })
  summary: StoreDashboardSummaryResponse;
}

export class StoreDashboardSeriesResponse {
  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['TMT', 'USD'],
    description: "Ciroda para birimi; diğer KPI'larda `null`.",
  })
  currency: string | null;

  @ApiProperty({ type: () => StoreDashboardComparisonResponse, description: 'Bütün mağazalar.' })
  total: StoreDashboardComparisonResponse;

  @ApiProperty({
    type: () => StoreDashboardComparisonResponse,
    isArray: true,
    description: '`stores` listesindeki her mağaza, aynı sırayla.',
  })
  stores: StoreDashboardComparisonResponse[];
}

export class StoreDashboardKpiResponse {
  @ApiProperty({ type: String, example: 'STORE_SALES' })
  code: string;

  @ApiProperty({ type: () => LocalizedTextResponse, description: 'Katalog adı (`#1 …`, ADR-060).' })
  name: LocalizedTextResponse;

  @ApiProperty({ type: String, enum: KPI_UNITS })
  unit: KpiUnit;

  @ApiProperty({
    type: String,
    enum: STORE_DASHBOARD_AGGREGATIONS,
    description:
      'Ayların ve mağazaların nasıl birleştiği: ciro, fiş, yeni müşteri ve ziyaretçi sayısı toplanır (`sum`); müşteri, eski müşteri ve ürün çeşitliliği ay içinde tekil olduğu için aylık ortalaması alınır (`average`); dönüşüm bir orandır, fişler ve ziyaretçiler önce toplanıp sonra bölünür (`ratio`, ADR-065).',
  })
  aggregation: StoreDashboardAggregation;

  @ApiProperty({ type: () => StoreDashboardSeriesResponse, isArray: true })
  series: StoreDashboardSeriesResponse[];
}

export class StoreDashboardStoreResponse {
  @ApiProperty({ type: Number, example: 0, description: 'İş yeri numarası (`L_CAPIDIV.NR`).' })
  nr: number;

  @ApiProperty({ type: String, nullable: true, example: 'LOREM' })
  name: string | null;
}

export class StoreDashboardRefreshResponse {
  @ApiProperty({
    type: Number,
    example: 60,
    description: '`STORE_DASHBOARD_REFRESH_INTERVAL_MINUTES`; `0` kapalı.',
  })
  intervalMinutes: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'API başladığından beri son biten yenileme.',
  })
  lastRunAt: Date | null;
}

export class StoreDashboardResponse {
  @ApiProperty({ type: Number, example: 2026 })
  year: number;

  @ApiProperty({ type: Number, example: 2025 })
  previousYear: number;

  @ApiProperty({
    type: Number,
    isArray: true,
    example: [2026],
    description: 'Seçilebilir yıllar, yeniden eskiye: değeri olan yıllar ve içinde bulunulan yıl.',
  })
  years: number[];

  @ApiProperty({
    type: String,
    example: '2026-09',
    description: 'İçinde bulunulan ay (`YYYY-MM`).',
  })
  currentMonth: string;

  @ApiProperty({ type: () => StoreDashboardRefreshResponse })
  refresh: StoreDashboardRefreshResponse;

  @ApiProperty({
    type: () => StoreDashboardStoreResponse,
    isArray: true,
    description: 'İki yıldan birinde değeri olan mağazalar, numara sırasıyla.',
  })
  stores: StoreDashboardStoreResponse[];

  @ApiProperty({
    type: () => StoreDashboardKpiResponse,
    isArray: true,
    description: 'Katalog sırasıyla #1–#7 ve #16 (ADR-065).',
  })
  kpis: StoreDashboardKpiResponse[];
}
