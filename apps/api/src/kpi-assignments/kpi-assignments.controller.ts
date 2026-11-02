import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { KpiPeriodErrorResponse } from '../kpi-periods/kpi-period-response.js';
import {
  ListKpiAssignmentsQueryDto,
  ListMyKpiPeriodsQueryDto,
  MyKpiPlanQueryDto,
} from './dto/kpi-assignment-query.dto.js';
import {
  AssignKpiTemplateDto,
  CopyKpiAssignmentsDto,
  SaveKpiTargetsDto,
} from './dto/kpi-assignment-write.dto.js';
import {
  KpiAssignmentCopyResponse,
  KpiAssignmentErrorResponse,
  KpiAssignmentListResponse,
  KpiAssignmentRecommendationsResponse,
  KpiAssignmentResponse,
  KpiAssignmentSummaryResponse,
  KpiMyPeriodListResponse,
  KpiMyPlanResponse,
} from './kpi-assignment-response.js';
import { KpiAssignmentsService } from './kpi-assignments.service.js';
import { KpiRecommendationsService } from './kpi-recommendations.service.js';

const WRITE_ERRORS_DESCRIPTION =
  'İş kuralı ihlali; `code` alanı hatayı belirtir: `KPI_ASSIGNMENT_UNKNOWN_TEMPLATE`, `KPI_ASSIGNMENT_EMPTY_TEMPLATE`, `KPI_ASSIGNMENT_INELIGIBLE` (`employees` döner), `KPI_ASSIGNMENT_UNKNOWN_ITEM` ve `KPI_ASSIGNMENT_INVALID_TARGET` (`itemId` döner). DTO doğrulama hatalarında `code` yoktur.';

@ApiTags('kpi-plans')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(AccessTokenGuard)
export class KpiAssignmentsController {
  constructor(
    @Inject(KpiAssignmentsService) private readonly kpiAssignmentsService: KpiAssignmentsService,
    @Inject(KpiRecommendationsService)
    private readonly kpiRecommendationsService: KpiRecommendationsService,
  ) {}

  @Get('kpi-periods/:periodId/assignments')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Dönemin planlarını çalışan adına göre sıralı ve sayfalı listeler.',
    description: 'Her satırda KPI sayısı ve hedefi girilmiş KPI sayısı döner.',
  })
  @ApiParam({ name: 'periodId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiAssignmentListResponse })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  listByPeriod(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Query() query: ListKpiAssignmentsQueryDto,
  ): Promise<KpiAssignmentListResponse> {
    return this.kpiAssignmentsService.listByPeriod(periodId, query);
  }

  @Post('kpi-periods/:periodId/assignments')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Şablonu seçilen çalışanlara bu dönem için atar (yalnız full_access).',
    description:
      'Şablonun KPI satırları her çalışana kopyalanır; varsayılan hedefler de gelir. `EMPLOYEE_*` KPI içeren şablon yalnız Tiger satış personeli eşlemesi olan çalışana verilebilir. Aynı dönemde aynı çalışana ikinci plan verilemez.',
  })
  @ApiParam({ name: 'periodId', type: String, format: 'uuid' })
  @ApiBody({ type: AssignKpiTemplateDto })
  @ApiCreatedResponse({ type: KpiAssignmentSummaryResponse, isArray: true })
  @ApiBadRequestResponse({
    description: WRITE_ERRORS_DESCRIPTION,
    type: KpiAssignmentErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Dönem kapalı ya da çalışanların planı zaten var.',
    type: KpiAssignmentErrorResponse,
  })
  @ApiNotFoundResponse({ description: 'Dönem ya da çalışan yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  assign(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Body() dto: AssignKpiTemplateDto,
  ): Promise<KpiAssignmentSummaryResponse[]> {
    return this.kpiAssignmentsService.assign(periodId, dto);
  }

  @Post('kpi-periods/:periodId/copy-assignments')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Başka bir dönemin planlarını hedefleriyle bu döneme kopyalar (yalnız full_access).',
    description:
      '`targetChangePercent` verilirse her hedef o yüzde kadar değiştirilerek kopyalanır (ADR-070). Planı zaten olan, pasifleşmiş ya da Tiger eşlemesini kaybetmiş çalışanlar atlanır ve nedenleriyle döner.',
  })
  @ApiParam({ name: 'periodId', type: String, format: 'uuid' })
  @ApiBody({ type: CopyKpiAssignmentsDto })
  @ApiOkResponse({ type: KpiAssignmentCopyResponse })
  @ApiConflictResponse({ description: 'Hedef dönem kapalı.', type: KpiPeriodErrorResponse })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  copyFrom(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Body() dto: CopyKpiAssignmentsDto,
  ): Promise<KpiAssignmentCopyResponse> {
    return this.kpiAssignmentsService.copyFrom(periodId, dto);
  }

  // The two "me" routes are declared before ':id' so that "me" is not parsed as a GUID.
  @Get('kpi-assignments/me')
  @ApiOperation({
    summary: 'Oturum sahibinin kendi planını döner.',
    description:
      'Yönetici yetkisi gerektirmez. `year` ve `month` birlikte verilirse o ayın planı, verilmezse en yeni plan döner; plan yoksa `plan` alanı `null` olur.',
  })
  @ApiOkResponse({ type: KpiMyPlanResponse })
  async getMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: MyKpiPlanQueryDto,
  ): Promise<KpiMyPlanResponse> {
    return { plan: await this.kpiAssignmentsService.getMine(request.employee.id, query) };
  }

  @Get('kpi-assignments/me/periods')
  @ApiOperation({
    summary: 'Oturum sahibinin planı olan dönemleri yeniden eskiye, sayfalı listeler.',
    description:
      'Yönetici yetkisi gerektirmez. "KPI’larım" ekranının dönem seçicisini besler; her satırda planın kimliği, dönemi, şablon adı ve toplam puanı döner.',
  })
  @ApiOkResponse({ type: KpiMyPeriodListResponse })
  listMyPeriods(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMyKpiPeriodsQueryDto,
  ): Promise<KpiMyPeriodListResponse> {
    return this.kpiAssignmentsService.listMyPeriods(request.employee.id, query);
  }

  // An employee's own KPI screen, as an administrator sees it (employee form "KPI" tab and
  // the leaderboard). Same answers as the "me" routes, for any employee.
  @Get('kpi-assignments/employees/:employeeId')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Bir çalışanın planını döner (yalnız full_access).',
    description:
      '`GET /kpi-assignments/me` ile aynıdır, ama verilen çalışan için: `year` ve `month` birlikte verilirse o ayın planı, verilmezse en yeni plan; plan yoksa `plan` `null`.',
  })
  @ApiParam({ name: 'employeeId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiMyPlanResponse })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  async getForEmployee(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Query() query: MyKpiPlanQueryDto,
  ): Promise<KpiMyPlanResponse> {
    return { plan: await this.kpiAssignmentsService.getMine(employeeId, query) };
  }

  @Get('kpi-assignments/employees/:employeeId/periods')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Bir çalışanın planı olan dönemleri listeler (yalnız full_access).',
    description: '`GET /kpi-assignments/me/periods` ile aynıdır, ama verilen çalışan için.',
  })
  @ApiParam({ name: 'employeeId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiMyPeriodListResponse })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  listEmployeePeriods(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Query() query: ListMyKpiPeriodsQueryDto,
  ): Promise<KpiMyPeriodListResponse> {
    return this.kpiAssignmentsService.listMyPeriods(employeeId, query);
  }

  @Get('kpi-assignments/:id')
  @UseGuards(FullAccessGuard)
  @ApiOperation({ summary: 'Planı KPI satırlarıyla döner (yalnız full_access).' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiAssignmentResponse })
  @ApiNotFoundResponse({ description: 'Plan yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<KpiAssignmentResponse> {
    return this.kpiAssignmentsService.get(id);
  }

  @Get('kpi-assignments/:id/recommendations')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Planın KPI satırları için rapor önerilerini döner (yalnız full_access).',
    description:
      "Değerler `dbo.kpi_report_summary` view'ından okunur: son 12 tam ayın ortalaması, ulaşılabilir max ve önerilen hedef (ADR-038, docs/REPORTS.md). Raporu ya da verisi olmayan satırlar yanıtta yer almaz.",
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiAssignmentRecommendationsResponse })
  @ApiNotFoundResponse({ description: 'Plan yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  getRecommendations(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<KpiAssignmentRecommendationsResponse> {
    return this.kpiRecommendationsService.forAssignment(id);
  }

  @Put('kpi-assignments/:id/targets')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Planın hedeflerini yazar (yalnız full_access).',
    description:
      'Yalnız gönderilen satırların hedefi değişir; KPI listesi, ağırlık ve girdiler şablondan gelir ve planda değişmez. Değeri gerçekten değişmeyen satır yazılmaz ve loglanmaz.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: SaveKpiTargetsDto })
  @ApiOkResponse({ type: KpiAssignmentResponse })
  @ApiBadRequestResponse({
    description: WRITE_ERRORS_DESCRIPTION,
    type: KpiAssignmentErrorResponse,
  })
  @ApiConflictResponse({ description: 'Dönem kapalı.', type: KpiPeriodErrorResponse })
  @ApiNotFoundResponse({ description: 'Plan yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  setTargets(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveKpiTargetsDto,
  ): Promise<KpiAssignmentResponse> {
    return this.kpiAssignmentsService.setTargets(id, dto);
  }

  @Delete('kpi-assignments/:id')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Planı siler (yalnız full_access).',
    description: 'Yalnız açık dönemde silinebilir. KPI satırları da silinir ve loglanır.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Plan silindi.' })
  @ApiConflictResponse({ description: 'Dönem kapalı.', type: KpiPeriodErrorResponse })
  @ApiNotFoundResponse({ description: 'Plan yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.kpiAssignmentsService.remove(id);
  }
}
