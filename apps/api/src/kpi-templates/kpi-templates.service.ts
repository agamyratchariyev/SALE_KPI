import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, In, Repository } from 'typeorm';

import type { AuditValue } from '../audit/audit-changes.js';
import { AuditService } from '../audit/audit.service.js';
import {
  SEARCH_COLLATION,
  andWhereEachSearchTerm,
  escapeLikePattern,
} from '../common/sql-search.js';
import type { BulkDeleteResponse, BulkUpdateResponse } from '../common/dto/bulk.dto.js';
import { getFirmNumber } from '../config/environment.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { changeTarget } from '../kpi-assignments/kpi-assignment-rules.js';
import { KpiDefinitionEntity } from '../kpi-definitions/entities/kpi-definition.entity.js';
import { periodLabel } from '../kpi-periods/kpi-period-rules.js';
import {
  readKpiDefinitionInputSchema,
  readKpiDefinitionName,
} from '../kpi-definitions/kpi-definition-response.js';
import type { KpiUnit } from '../kpi-definitions/kpi-definition.types.js';
import type { KpiInputField, LocalizedText } from '../kpi-definitions/kpi-input-schema.js';
import {
  KpiInputValuesError,
  type KpiLookupValues,
  parseKpiInputValues,
} from '../kpi-definitions/kpi-input-values.js';
import { ItemGroupEntity } from '../item-groups/entities/item-group.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import type { CopyKpiTemplateDto } from './dto/copy-kpi-template.dto.js';
import type { ListKpiTemplatesQueryDto } from './dto/list-kpi-templates-query.dto.js';
import type { KpiTemplateItemDto, SaveKpiTemplateDto } from './dto/save-kpi-template.dto.js';
import { KpiTemplateItemEntity } from './entities/kpi-template-item.entity.js';
import { KpiTemplateEntity } from './entities/kpi-template.entity.js';
import {
  kpiTemplateBadRequest,
  kpiTemplateInUse,
  kpiTemplateNameTaken,
} from './kpi-template-errors.js';
import {
  type KpiTemplateBulkCopyResponse,
  type KpiTemplateItemStats,
  type KpiTemplatePlanUsage,
  type KpiTemplateListResponse,
  type KpiTemplateResponse,
  toKpiTemplateResponse,
  toKpiTemplateSummary,
} from './kpi-template-response.js';
import {
  REQUIRED_TOTAL_WEIGHT,
  copyNameBase,
  findTemplatesInUse,
  nextCopyName,
  sumWeights,
  templateItemKey,
  type TemplateUsage,
} from './kpi-template-rules.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_COPY_NAME_ATTEMPTS = 3;

type ItemValues = Pick<
  KpiTemplateItemEntity,
  'inputValues' | 'kpiDefinitionId' | 'sortOrder' | 'targetValue' | 'weight'
>;

/** A KPI row plus what its template's log entry shows about it (ADR-036). */
interface LoggedItem extends ItemValues {
  code: string;
  name: LocalizedText;
}

interface PreparedItem extends LoggedItem {
  lookups: KpiLookupValues;
}

function isUniqueViolation(error: unknown): boolean {
  const number = (error as { driverError?: { number?: number } }).driverError?.number;
  return number === 2_601 || number === 2_627;
}

/**
 * KPI rows are logged on their template, not one by one: their ids are regenerated on
 * every save, so only the list as a whole is meaningful in the history.
 */
function toItemSnapshots(items: readonly LoggedItem[]): AuditValue {
  return items.map((item) => ({
    code: item.code,
    name: { ...item.name },
    weight: item.weight,
    targetValue: item.targetValue,
    inputValues: JSON.parse(item.inputValues) as AuditValue,
  }));
}

function sameItems(left: readonly ItemValues[], right: readonly ItemValues[]): boolean {
  const key = (items: readonly ItemValues[]) =>
    JSON.stringify(
      items.map((item) => [
        item.kpiDefinitionId.toLowerCase(),
        item.weight,
        item.targetValue,
        item.inputValues,
      ]),
    );

  return key(left) === key(right);
}

@Injectable()
export class KpiTemplatesService {
  constructor(
    @InjectRepository(KpiTemplateEntity)
    private readonly templateRepository: Repository<KpiTemplateEntity>,
    @InjectRepository(KpiTemplateItemEntity)
    private readonly itemRepository: Repository<KpiTemplateItemEntity>,
    @InjectRepository(KpiDefinitionEntity)
    private readonly definitionRepository: Repository<KpiDefinitionEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(ItemGroupEntity)
    private readonly itemGroupRepository: Repository<ItemGroupEntity>,
    // Read-only here: a template that a plan was built from cannot be deleted (ADR-040).
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(query: ListKpiTemplatesQueryDto): Promise<KpiTemplateListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const builder = this.templateRepository
      .createQueryBuilder('template')
      .orderBy('template.name', 'ASC');

    andWhereEachSearchTerm(builder, query.search, [
      (parameter) => `template.name COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
      (parameter) => `template.description COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
    ]);

    if (query.isActive !== undefined) {
      builder.andWhere('template.isActive = :isActive', { isActive: query.isActive });
    }

    const [templates, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const ids = templates.map((template) => template.id);
    const [stats, usage] = await Promise.all([this.loadItemStats(ids), this.loadPlanUsage(ids)]);

    return {
      items: templates.map((template) =>
        toKpiTemplateSummary(
          template,
          stats.get(template.id.toLowerCase()),
          usage.get(template.id.toLowerCase()),
        ),
      ),
      limit,
      page,
      total,
    };
  }

  async get(id: string): Promise<KpiTemplateResponse> {
    const template = await this.templateRepository.findOneBy({ id });

    if (!template) {
      throw new NotFoundException('KPI template not found.');
    }

    const items = await this.itemRepository.find({
      where: { templateId: template.id },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });

    return toKpiTemplateResponse(template, items);
  }

  async create(dto: SaveKpiTemplateDto): Promise<KpiTemplateResponse> {
    const items = await this.prepareItems(dto.items);

    try {
      const id = await this.dataSource.transaction(async (manager) => {
        const template = await this.audit.insert(
          manager,
          KpiTemplateEntity,
          {
            name: dto.name,
            description: dto.description || null,
            isActive: dto.isActive ?? true,
          },
          { extraChanges: { items: { new: toItemSnapshots(items) } } },
        );

        await this.insertItems(manager, template.id, items);

        return template.id;
      });

      return this.get(id);
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }

  /**
   * Replaces the header and the item list atomically. The item list is rewritten (with new
   * ids) only when it differs from the stored one.
   */
  async update(id: string, dto: SaveKpiTemplateDto): Promise<KpiTemplateResponse> {
    const items = await this.prepareItems(dto.items);

    try {
      await this.dataSource.transaction(async (manager) => {
        const template = await manager.getRepository(KpiTemplateEntity).findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!template) {
          throw new NotFoundException('KPI template not found.');
        }

        const currentItems = await this.loadLoggedItems(manager, template.id);
        const itemsChanged = !sameItems(currentItems, items);

        await this.audit.update(
          manager,
          KpiTemplateEntity,
          { id: template.id },
          {
            name: dto.name,
            description: dto.description || null,
            ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
          },
          itemsChanged
            ? {
                extraChanges: {
                  items: { old: toItemSnapshots(currentItems), new: toItemSnapshots(items) },
                },
              }
            : {},
        );

        if (itemsChanged) {
          await this.audit.delete(
            manager,
            KpiTemplateItemEntity,
            { templateId: template.id },
            { log: false },
          );
          await this.insertItems(manager, template.id, items);
        }
      });

      return this.get(id);
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }

  /** Soft delete: templates stay readable and can be reactivated with `isActive: true`. */
  async deactivate(id: string): Promise<void> {
    const result = await this.audit.update(
      this.dataSource.manager,
      KpiTemplateEntity,
      { id },
      { isActive: false },
    );

    if (result.matched === 0) {
      throw new NotFoundException('KPI template not found.');
    }
  }

  /**
   * Deletes templates with their KPI rows. A template a KPI plan was built from is kept:
   * the plan points at it, and its history stays readable (ADR-040). Either every selected
   * template is deletable or nothing is deleted.
   */
  async deleteMany(ids: string[], via?: string): Promise<BulkDeleteResponse> {
    const templates = await this.templateRepository.find({ where: { id: In(ids) } });
    const found = new Map(templates.map((template) => [template.id.toLowerCase(), template]));
    const missing = ids.filter((id) => !found.has(id.toLowerCase()));

    if (missing.length > 0) {
      throw new NotFoundException(`KPI templates not found: ${missing.join(', ')}.`);
    }

    const usage = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.templateId', 'templateId')
      .addSelect('COUNT(*)', 'planCount')
      .where('assignment.templateId IN (:...ids)', {
        ids: templates.map((template) => template.id),
      })
      .groupBy('assignment.templateId')
      .getRawMany<TemplateUsage>();
    const inUse = findTemplatesInUse(templates, usage);

    if (inUse.length > 0) {
      throw kpiTemplateInUse(inUse);
    }

    await this.dataSource.transaction(async (manager) => {
      for (const template of templates) {
        const items = await this.loadLoggedItems(manager, template.id);

        // The rows are listed in the template's own entry, so they are not logged again.
        await this.audit.delete(
          manager,
          KpiTemplateItemEntity,
          { templateId: template.id },
          { log: false },
        );
        await this.audit.delete(
          manager,
          KpiTemplateEntity,
          { id: template.id },
          {
            ...(via ? { context: { via } } : {}),
            extraChanges: { items: { old: toItemSnapshots(items) } },
          },
        );
      }
    });

    return { deleted: templates.length };
  }

  /** Bulk (de)activation (ADR-035); only templates whose state changes are counted. */
  async setActiveMany(ids: string[], isActive: boolean): Promise<BulkUpdateResponse> {
    const { changedIds } = await this.audit.update(
      this.dataSource.manager,
      KpiTemplateEntity,
      { id: In(ids) },
      { isActive },
      { context: { via: 'bulk-status' } },
    );

    return { updated: changedIds.length };
  }

  /**
   * Copies every selected template in request order. All ids must exist, otherwise
   * nothing is copied; copies are created one by one so their " (n)" names stay distinct.
   */
  async copyMany(ids: string[], targetChangePercent = 0): Promise<KpiTemplateBulkCopyResponse> {
    const found = await this.templateRepository.find({
      select: { id: true },
      where: { id: In(ids) },
    });
    // Request ids are lower-cased by the DTO; responses use the stored form like every other id.
    const storedIds = new Map(found.map((template) => [template.id.toLowerCase(), template.id]));
    const missing = ids.filter((id) => !storedIds.has(id.toLowerCase()));

    if (missing.length > 0) {
      throw new NotFoundException(`KPI templates not found: ${missing.join(', ')}.`);
    }

    const copies: KpiTemplateBulkCopyResponse['copies'] = [];

    for (const id of ids) {
      const sourceId = storedIds.get(id.toLowerCase()) ?? id;
      const copy = await this.copyTemplate(sourceId, undefined, targetChangePercent, 'bulk-copy');
      copies.push({ sourceId, id: copy.id, name: copy.name });
    }

    return { copies };
  }

  /**
   * Duplicates a template and all of its items as a new active template. The items are
   * copied as stored, they were validated when the source was saved; only the default
   * targets may be changed by `targetChangePercent` (ADR-070).
   */
  copy(id: string, dto: CopyKpiTemplateDto): Promise<KpiTemplateResponse> {
    return this.copyTemplate(id, dto.name, dto.targetChangePercent ?? 0);
  }

  private async copyTemplate(
    id: string,
    requestedName: string | undefined,
    targetChangePercent: number,
    via?: string,
  ): Promise<KpiTemplateResponse> {
    const source = await this.templateRepository.findOneBy({ id });

    if (!source) {
      throw new NotFoundException('KPI template not found.');
    }

    const items = (await this.loadLoggedItems(this.dataSource.manager, source.id)).map((item) => ({
      ...item,
      targetValue: changeTarget(item.targetValue, targetChangePercent, item.unit),
    }));
    const context: Record<string, AuditValue> = {
      copiedFrom: { id: source.id, name: source.name },
      ...(via ? { via } : {}),
      ...(targetChangePercent === 0 ? {} : { targetChangePercent }),
    };

    for (let attempt = 1; ; attempt += 1) {
      const name = requestedName ?? (await this.generateCopyName(source.name));

      try {
        const copyId = await this.dataSource.transaction(async (manager) => {
          const copy = await this.audit.insert(
            manager,
            KpiTemplateEntity,
            { name, description: source.description, isActive: true },
            { context, extraChanges: { items: { new: toItemSnapshots(items) } } },
          );

          await this.insertItems(manager, copy.id, items);

          return copy.id;
        });

        return this.get(copyId);
      } catch (error: unknown) {
        // A concurrent copy took the generated name; the next attempt picks the next number.
        if (!requestedName && isUniqueViolation(error) && attempt < MAX_COPY_NAME_ATTEMPTS) {
          continue;
        }

        this.rethrowWriteError(error);
      }
    }
  }

  private async generateCopyName(sourceName: string): Promise<string> {
    const rows = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.name', 'name')
      .where('template.name LIKE :pattern', {
        pattern: `${escapeLikePattern(copyNameBase(sourceName))} (%)`,
      })
      .getRawMany<{ name: string }>();

    return nextCopyName(
      sourceName,
      rows.map((row) => row.name),
    );
  }

  /** The template's own log entry lists its KPI rows, so the rows are not logged again. */
  private async insertItems(
    manager: EntityManager,
    templateId: string,
    items: readonly ItemValues[],
  ): Promise<void> {
    await this.audit.insertMany(
      manager,
      KpiTemplateItemEntity,
      items.map((item) => ({
        inputValues: item.inputValues,
        kpiDefinitionId: item.kpiDefinitionId,
        sortOrder: item.sortOrder,
        targetValue: item.targetValue,
        templateId,
        weight: item.weight,
      })),
      { log: false },
    );
  }

  private async loadLoggedItems(
    manager: EntityManager,
    templateId: string,
  ): Promise<Array<LoggedItem & { unit: KpiUnit }>> {
    const items = await manager.getRepository(KpiTemplateItemEntity).find({
      where: { templateId },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });

    return items.map((item) => {
      if (!item.definition) {
        throw new Error(`kpi_template_items[${item.id}] was loaded without its definition.`);
      }

      return {
        code: item.definition.code,
        inputValues: item.inputValues,
        kpiDefinitionId: item.kpiDefinitionId,
        name: readKpiDefinitionName(item.definition),
        sortOrder: item.sortOrder,
        targetValue: item.targetValue,
        unit: item.definition.unit,
        weight: item.weight,
      };
    });
  }

  /**
   * Validates everything that needs the database before any write: the 100 total, active
   * definitions, inputs against each definition's schema, duplicates and store ids.
   */
  private async prepareItems(items: KpiTemplateItemDto[]): Promise<PreparedItem[]> {
    const totalWeight = sumWeights(items.map((item) => item.weight));

    if (totalWeight !== REQUIRED_TOTAL_WEIGHT) {
      throw kpiTemplateBadRequest(
        'KPI_TEMPLATE_WEIGHT_TOTAL',
        `Item weights must add up to ${REQUIRED_TOTAL_WEIGHT} (got ${totalWeight}).`,
        { totalWeight },
      );
    }

    const schemas = await this.loadActiveDefinitionSchemas(
      items.map((item) => item.kpiDefinitionId),
    );
    const seenKeys = new Map<string, number>();

    const prepared = items.map((item, index): PreparedItem => {
      const definition = schemas.get(item.kpiDefinitionId.toLowerCase());

      if (!definition) {
        throw kpiTemplateBadRequest(
          'KPI_TEMPLATE_UNKNOWN_DEFINITION',
          `items[${index}].kpiDefinitionId is not an active KPI definition.`,
          { itemIndex: index },
        );
      }

      const parsed = this.parseInputValues(definition.inputSchema, item.inputValues, index);
      const inputValues = JSON.stringify(parsed.values);
      const key = templateItemKey(definition.id, inputValues);
      const duplicateOf = seenKeys.get(key);

      if (duplicateOf !== undefined) {
        throw kpiTemplateBadRequest(
          'KPI_TEMPLATE_DUPLICATE_ITEM',
          `items[${index}] repeats items[${duplicateOf}] with the same inputs.`,
          { itemIndex: index, duplicateOf },
        );
      }

      seenKeys.set(key, index);

      return {
        code: definition.code,
        inputValues,
        kpiDefinitionId: definition.id,
        lookups: parsed.lookups,
        name: definition.name,
        sortOrder: index + 1,
        targetValue: item.targetValue ?? null,
        weight: item.weight,
      };
    });

    await this.assertLookupIdsExist(prepared);

    return prepared;
  }

  private async loadActiveDefinitionSchemas(
    ids: string[],
  ): Promise<
    Map<string, { id: string; code: string; name: LocalizedText; inputSchema: KpiInputField[] }>
  > {
    const uniqueIds = [...new Set(ids.map((id) => id.toLowerCase()))];
    const definitions = await this.definitionRepository.find({
      where: { id: In(uniqueIds), isActive: true },
    });

    return new Map(
      definitions.map((definition) => [
        definition.id.toLowerCase(),
        {
          id: definition.id,
          code: definition.code,
          name: readKpiDefinitionName(definition),
          inputSchema: readKpiDefinitionInputSchema(definition),
        },
      ]),
    );
  }

  private parseInputValues(schema: KpiInputField[], values: unknown, index: number) {
    try {
      return parseKpiInputValues(schema, values, `items[${index}].inputValues`);
    } catch (error: unknown) {
      if (error instanceof KpiInputValuesError) {
        throw kpiTemplateBadRequest('KPI_TEMPLATE_INVALID_INPUT', error.message, {
          itemIndex: index,
          path: error.path,
        });
      }

      throw error;
    }
  }

  private async assertLookupIdsExist(items: PreparedItem[]): Promise<void> {
    await this.assertStoresExist(items);
    await this.assertItemGroupsExist(items);
  }

  private async assertStoresExist(items: PreparedItem[]): Promise<void> {
    const storeIds = [...new Set(items.flatMap((item) => item.lookups.stores))];

    if (storeIds.length === 0) {
      return;
    }

    const found = await this.storeRepository.find({
      select: { id: true },
      where: { id: In(storeIds), firmNr: getFirmNumber() },
    });
    const existing = new Set(found.map((store) => store.id));

    for (const [index, item] of items.entries()) {
      const missing = item.lookups.stores.filter((id) => !existing.has(id));

      if (missing.length > 0) {
        throw kpiTemplateBadRequest(
          'KPI_TEMPLATE_UNKNOWN_STORE',
          `items[${index}] references unknown stores: ${missing.join(', ')}.`,
          { itemIndex: index, storeIds: missing },
        );
      }
    }
  }

  /** Group codes must be on an item card of the firm; empty groups are not listed (ADR-045). */
  private async assertItemGroupsExist(items: PreparedItem[]): Promise<void> {
    const codes = [...new Set(items.flatMap((item) => item.lookups.itemGroups))];

    if (codes.length === 0) {
      return;
    }

    const found = await this.itemGroupRepository.find({
      select: { code: true },
      where: { code: In(codes) },
    });
    const existing = new Set(found.map((group) => group.code.toUpperCase()));

    for (const [index, item] of items.entries()) {
      const missing = item.lookups.itemGroups.filter((code) => !existing.has(code));

      if (missing.length > 0) {
        throw kpiTemplateBadRequest(
          'KPI_TEMPLATE_UNKNOWN_ITEM_GROUP',
          `items[${index}] references unknown item groups: ${missing.join(', ')}.`,
          { itemIndex: index, groupCodes: missing },
        );
      }
    }
  }

  /** One grouped query for the whole page instead of one per template. */
  private async loadItemStats(templateIds: string[]): Promise<Map<string, KpiTemplateItemStats>> {
    if (templateIds.length === 0) {
      return new Map();
    }

    const rows = await this.itemRepository
      .createQueryBuilder('item')
      .select('item.templateId', 'templateId')
      .addSelect('COUNT(*)', 'itemCount')
      .addSelect('SUM(item.weight)', 'totalWeight')
      .where('item.templateId IN (:...templateIds)', { templateIds })
      .groupBy('item.templateId')
      .getRawMany<{ templateId: string; itemCount: number; totalWeight: number | string }>();

    return new Map(
      rows.map((row) => [
        row.templateId.toLowerCase(),
        { itemCount: Number(row.itemCount), totalWeight: Number(row.totalWeight) },
      ]),
    );
  }

  /** How many KPI plans each template was assigned to, and the newest month among them. */
  private async loadPlanUsage(templateIds: string[]): Promise<Map<string, KpiTemplatePlanUsage>> {
    if (templateIds.length === 0) {
      return new Map();
    }

    const rows = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.period', 'period')
      .select('assignment.templateId', 'templateId')
      .addSelect('COUNT(*)', 'planCount')
      .addSelect('MAX(period.year * 100 + period.month)', 'lastMonth')
      .where('assignment.templateId IN (:...templateIds)', { templateIds })
      .groupBy('assignment.templateId')
      .getRawMany<{ templateId: string; planCount: number; lastMonth: number }>();

    return new Map(
      rows.map((row) => {
        const lastMonth = Number(row.lastMonth);

        return [
          row.templateId.toLowerCase(),
          {
            planCount: Number(row.planCount),
            lastPeriod: periodLabel({ year: Math.floor(lastMonth / 100), month: lastMonth % 100 }),
          },
        ];
      }),
    );
  }

  private rethrowWriteError(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw kpiTemplateNameTaken();
    }

    throw error;
  }
}
