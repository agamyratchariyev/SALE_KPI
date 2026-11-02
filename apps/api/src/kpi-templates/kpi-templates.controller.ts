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
import { FullAccessGuard } from '../auth/full-access.guard.js';
import {
  BulkDeleteResponse,
  BulkIdsDto,
  BulkStatusDto,
  BulkUpdateResponse,
} from '../common/dto/bulk.dto.js';
import { BulkCopyKpiTemplatesDto, CopyKpiTemplateDto } from './dto/copy-kpi-template.dto.js';
import { ListKpiTemplatesQueryDto } from './dto/list-kpi-templates-query.dto.js';
import { SaveKpiTemplateDto } from './dto/save-kpi-template.dto.js';
import {
  KpiTemplateBulkCopyResponse,
  KpiTemplateErrorResponse,
  KpiTemplateListResponse,
  KpiTemplateResponse,
} from './kpi-template-response.js';
import { KpiTemplatesService } from './kpi-templates.service.js';

const WRITE_ERRORS_DESCRIPTION =
  'İş kuralı ihlali; `code` alanı hatayı belirtir: `KPI_TEMPLATE_WEIGHT_TOTAL` (ağırlık toplamı 100 değil, `totalWeight` döner), `KPI_TEMPLATE_UNKNOWN_DEFINITION`, `KPI_TEMPLATE_INVALID_INPUT` (`path` döner), `KPI_TEMPLATE_UNKNOWN_STORE` (`storeIds` döner), `KPI_TEMPLATE_DUPLICATE_ITEM` (`duplicateOf` döner). DTO doğrulama hatalarında `code` yoktur.';

@ApiTags('kpi-templates')
@ApiBearerAuth('access-token')
@Controller('kpi-templates')
@UseGuards(AccessTokenGuard)
export class KpiTemplatesController {
  constructor(
    @Inject(KpiTemplatesService) private readonly kpiTemplatesService: KpiTemplatesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'KPI şablonlarını ada göre sıralı ve sayfalı listeler.',
    description:
      'Oturum açmış her kullanıcıya açıktır. Her satırda KPI sayısı ve ağırlık toplamı döner.',
  })
  @ApiOkResponse({ type: KpiTemplateListResponse })
  list(@Query() query: ListKpiTemplatesQueryDto): Promise<KpiTemplateListResponse> {
    return this.kpiTemplatesService.list(query);
  }

  @Post('bulk-status')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Seçilen KPI şablonlarını toplu olarak aktifleştirir veya pasifleştirir (yalnız full_access).',
    description:
      "Tek UPDATE ile çalışır; yalnız durumu gerçekten değişen şablonlar sayılır. Bulunamayan id'ler yok sayılır.",
  })
  @ApiBody({ type: BulkStatusDto })
  @ApiOkResponse({ type: BulkUpdateResponse })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  setActiveMany(@Body() dto: BulkStatusDto): Promise<BulkUpdateResponse> {
    return this.kpiTemplatesService.setActiveMany(dto.ids, dto.isActive);
  }

  @Post('bulk-copy')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary:
      'Seçilen KPI şablonlarını bütün satırlarıyla toplu olarak kopyalar (yalnız full_access).',
    description:
      'Her şablon `POST /kpi-templates/:id/copy` ile aynı kurallarla, istek sırasıyla kopyalanır; adlara bir sonraki boş " (n)" eki getirilir ve kopyalar aktif oluşur. `targetChangePercent` her kopyanın varsayılan hedeflerine uygulanır (ADR-070). Id\'lerden biri bile yoksa hiçbir şey kopyalanmaz (404).',
  })
  @ApiBody({ type: BulkCopyKpiTemplatesDto })
  @ApiCreatedResponse({ type: KpiTemplateBulkCopyResponse })
  @ApiNotFoundResponse({ description: 'Seçilen şablonlardan en az biri bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  copyMany(@Body() dto: BulkCopyKpiTemplatesDto): Promise<KpiTemplateBulkCopyResponse> {
    return this.kpiTemplatesService.copyMany(dto.ids, dto.targetChangePercent ?? 0);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bir KPI şablonunu KPI satırlarıyla birlikte döner.' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiTemplateResponse })
  @ApiNotFoundResponse({ description: 'Şablon bulunamadı.' })
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<KpiTemplateResponse> {
    return this.kpiTemplatesService.get(id);
  }

  @Post()
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'KPI şablonu oluşturur (yalnız full_access).',
    description:
      'Satırların ağırlık toplamı tam 100 olmalıdır. Her satırın `inputValues` alanı KPI tanımının `inputSchema` tarifine göre doğrulanır; aynı KPI aynı girdilerle iki kez eklenemez.',
  })
  @ApiCreatedResponse({ type: KpiTemplateResponse })
  @ApiBadRequestResponse({ type: KpiTemplateErrorResponse, description: WRITE_ERRORS_DESCRIPTION })
  @ApiConflictResponse({
    type: KpiTemplateErrorResponse,
    description: '`KPI_TEMPLATE_NAME_TAKEN`: aynı adda şablon var.',
  })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  create(@Body() dto: SaveKpiTemplateDto): Promise<KpiTemplateResponse> {
    return this.kpiTemplatesService.create(dto);
  }

  @Put(':id')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'KPI şablonunu satırlarıyla birlikte tamamen değiştirir (yalnız full_access).',
    description:
      "Başlık ve bütün satır listesi tek transaction içinde değiştirilir; satır id'leri yeniden üretilir. Kurallar oluşturmayla aynıdır.",
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiTemplateResponse })
  @ApiBadRequestResponse({ type: KpiTemplateErrorResponse, description: WRITE_ERRORS_DESCRIPTION })
  @ApiConflictResponse({
    type: KpiTemplateErrorResponse,
    description: '`KPI_TEMPLATE_NAME_TAKEN`: aynı adda şablon var.',
  })
  @ApiNotFoundResponse({ description: 'Şablon bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveKpiTemplateDto,
  ): Promise<KpiTemplateResponse> {
    return this.kpiTemplatesService.update(id, dto);
  }

  @Post(':id/copy')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'KPI şablonunu bütün satırlarıyla birlikte kopyalar (yalnız full_access).',
    description:
      'Yeni şablon aktif olarak oluşturulur; açıklama ve bütün satırlar (KPI, ağırlık, varsayılan hedef, bilgiler, sıra) aynen kopyalanır. `targetChangePercent` verilirse varsayılan hedefler o yüzde kadar değiştirilir (ADR-070). Kaynak pasif olsa da kopyalanabilir. `name` verilmezse kaynağın adına bir sonraki boş " (n)" eki getirilir (ör. `MÜDÜR KPI 01 (2)`); kopyanın kopyası numaralandırmayı sürdürür.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Kopyalanacak şablon' })
  @ApiBody({ type: CopyKpiTemplateDto, required: false })
  @ApiCreatedResponse({ type: KpiTemplateResponse })
  @ApiConflictResponse({
    type: KpiTemplateErrorResponse,
    description: '`KPI_TEMPLATE_NAME_TAKEN`: gönderilen `name` kullanımda.',
  })
  @ApiNotFoundResponse({ description: 'Kaynak şablon bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  copy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CopyKpiTemplateDto,
  ): Promise<KpiTemplateResponse> {
    return this.kpiTemplatesService.copy(id, dto);
  }

  @Delete(':id')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'KPI şablonunu pasifleştirir (yalnız full_access).',
    description: 'Kalıcı silme yapmaz; `PUT` ile `isActive: true` gönderilerek geri açılabilir.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Şablon bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.kpiTemplatesService.deactivate(id);
  }

  @Delete(':id/permanent')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'KPI şablonunu kalıcı olarak siler (yalnız full_access).',
    description:
      'Şablon ve KPI satırları veritabanından silinir; geri alınamaz. Şablondan bir KPI planı oluşturulduysa silinmez, `409 KPI_TEMPLATE_IN_USE` döner ve şablon yalnız pasifleştirilebilir (ADR-040).',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Şablon silindi.' })
  @ApiConflictResponse({
    type: KpiTemplateErrorResponse,
    description: '`KPI_TEMPLATE_IN_USE`: şablon bir KPI planında kullanılıyor.',
  })
  @ApiNotFoundResponse({ description: 'Şablon bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.kpiTemplatesService.deleteMany([id]);
  }

  @Post('bulk-delete')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seçilen KPI şablonlarını kalıcı olarak siler (yalnız full_access).',
    description:
      'Ya hepsi silinir ya da hiçbiri: seçimde bir KPI planında kullanılan şablon varsa `409 KPI_TEMPLATE_IN_USE` döner ve kullanılan şablonlar plan sayısıyla listelenir.',
  })
  @ApiBody({ type: BulkIdsDto })
  @ApiOkResponse({ type: BulkDeleteResponse })
  @ApiConflictResponse({
    type: KpiTemplateErrorResponse,
    description: '`KPI_TEMPLATE_IN_USE`: seçimdeki şablonlardan biri kullanılıyor.',
  })
  @ApiNotFoundResponse({ description: 'Seçimde bulunamayan id var.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  deleteMany(@Body() dto: BulkIdsDto): Promise<BulkDeleteResponse> {
    return this.kpiTemplatesService.deleteMany(dto.ids, 'bulk-delete');
  }
}
