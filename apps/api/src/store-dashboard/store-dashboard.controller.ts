import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { StoreDashboardQueryDto } from './dto/store-dashboard-query.dto.js';
import { StoreDashboardWeeklyQueryDto } from './dto/store-dashboard-weekly-query.dto.js';
import {
  StoreDashboardResponse,
  StoreDashboardWeeklyResponse,
} from './store-dashboard-response.js';
import { StoreDashboardService } from './store-dashboard.service.js';

@ApiTags('store-dashboard')
@ApiBearerAuth('access-token')
@Controller('store-dashboard')
@UseGuards(AccessTokenGuard, FullAccessGuard)
export class StoreDashboardController {
  constructor(
    @Inject(StoreDashboardService) private readonly storeDashboardService: StoreDashboardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Mağaza KPI'larını (#1–#7, #16) iki takvim yılında ay ay karşılaştırır.",
    description:
      "Yalnız `full_access`. Seçilen yıl bir önceki yılla karşılaştırılır; artış iki yılda da değeri olan bitmiş aylardan hesaplanır, içinde bulunulan ay karşılaştırılmaz. Değerler `store_kpi_month_values` tablosundan okunur; tabloyu `STORE_DASHBOARD_REFRESH_INTERVAL_MINUTES` aralığıyla çalışan iş `dbo.kpi_month_values` ve `dbo.kpi_month_visitor_values`'tan doldurur, dönüşümü hesaplamanın kurallarıyla ölçer. İstek Tiger'dan hesap yapmaz (ADR-061, ADR-065).",
  })
  @ApiOkResponse({ type: StoreDashboardResponse })
  @ApiForbiddenResponse({ description: 'Oturum sahibinin `full_access` yetkisi yok.' })
  get(@Query() query: StoreDashboardQueryDto): Promise<StoreDashboardResponse> {
    return this.storeDashboardService.get(query);
  }

  @Get('weekly')
  @ApiOperation({
    summary: "Mağaza KPI'larını (#1–#7, #16) son haftalarda hafta hafta karşılaştırır.",
    description:
      "Yalnız `full_access`. Haftalar pazartesi–pazardır ve yalnız analiz içindir; resmî KPI dönemi aydır. Seçilen sayıda bitmiş hafta ve içinde bulunulan hafta döner. Bitmiş her hafta bir önceki haftayla ve seçilen haftaların ortalamasıyla karşılaştırılır; içinde bulunulan hafta karşılaştırılmaz ve ortalamaya girmez. Değerler `store_kpi_week_values` tablosundan okunur; istek Tiger'dan hesap yapmaz (ADR-071).",
  })
  @ApiOkResponse({ type: StoreDashboardWeeklyResponse })
  @ApiForbiddenResponse({ description: 'Oturum sahibinin `full_access` yetkisi yok.' })
  getWeekly(@Query() query: StoreDashboardWeeklyQueryDto): Promise<StoreDashboardWeeklyResponse> {
    return this.storeDashboardService.getWeekly(query);
  }
}
