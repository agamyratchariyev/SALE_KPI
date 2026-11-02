import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, In, Repository } from 'typeorm';

import type { AuditValue } from '../audit/audit-changes.js';
import { AuditService } from '../audit/audit.service.js';
import { SEARCH_COLLATION, andWhereEachSearchTerm } from '../common/sql-search.js';
import { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import { salaryInForce } from '../employee-salaries/employee-salary-rules.js';
import { type SalaryPayoutResponse, toSalaryPayout } from '../employee-salaries/salary-payout.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { readKpiDefinitionName } from '../kpi-definitions/kpi-definition-response.js';
import type { KpiScope, KpiUnit } from '../kpi-definitions/kpi-definition.types.js';
import type { LocalizedText } from '../kpi-definitions/kpi-input-schema.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { KpiResultEntity } from '../kpi-results/entities/kpi-result.entity.js';
import { kpiPeriodClosed } from '../kpi-periods/kpi-period-errors.js';
import { isPeriodOpen, periodLabel } from '../kpi-periods/kpi-period-rules.js';
import { KpiTemplateItemEntity } from '../kpi-templates/entities/kpi-template-item.entity.js';
import { KpiTemplateEntity } from '../kpi-templates/entities/kpi-template.entity.js';
import type {
  ListKpiAssignmentsQueryDto,
  ListMyKpiPeriodsQueryDto,
  MyKpiPlanQueryDto,
} from './dto/kpi-assignment-query.dto.js';
import type {
  AssignKpiTemplateDto,
  CopyKpiAssignmentsDto,
  SaveKpiTargetsDto,
} from './dto/kpi-assignment-write.dto.js';
import { KpiAssignmentItemEntity } from './entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from './entities/kpi-assignment.entity.js';
import { kpiAssignmentBadRequest, kpiAssignmentExists } from './kpi-assignment-errors.js';
import { loadFirmSalespersonIds } from './kpi-entity-lookup.js';
import {
  type KpiAssignmentCopyResponse,
  type KpiAssignmentItemStats,
  type KpiAssignmentListResponse,
  type KpiAssignmentResponse,
  type KpiAssignmentSkippedResponse,
  type KpiAssignmentSummaryResponse,
  type KpiMyPeriodListResponse,
  toKpiAssignmentResponse,
  toKpiAssignmentSummary,
  toKpiMyPeriod,
  toKpiSalarySummary,
} from './kpi-assignment-response.js';
import {
  type AssignableEmployee,
  changeTarget,
  findIneligibleEmployees,
  findTargetProblem,
  planItemsFromTemplate,
  requiresErpLink,
  type PlanItemValues,
} from './kpi-assignment-rules.js';

const DEFAULT_PAGE_SIZE = 20;
/** One plan per month at most, so a page of the own-periods list is two years. */
const MY_PERIODS_PAGE_SIZE = 24;

/** A KPI row plus what its plan's log entry shows about it (ADR-036). */
interface LoggedItem extends PlanItemValues {
  code: string;
  name: LocalizedText;
}

/** What the plan rules need from a row's KPI definition. */
interface ItemMeta {
  scope: KpiScope;
  unit: KpiUnit;
}

/**
 * KPI rows are logged on their plan, not one by one: the plan's entry carries the list as
 * a whole, exactly like a template's items (ADR-036).
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

@Injectable()
export class KpiAssignmentsService {
  constructor(
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @InjectRepository(KpiAssignmentItemEntity)
    private readonly itemRepository: Repository<KpiAssignmentItemEntity>,
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @InjectRepository(KpiTemplateEntity)
    private readonly templateRepository: Repository<KpiTemplateEntity>,
    @InjectRepository(KpiTemplateItemEntity)
    private readonly templateItemRepository: Repository<KpiTemplateItemEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(EmployeeSalaryEntity)
    private readonly salaryRepository: Repository<EmployeeSalaryEntity>,
    @InjectRepository(ErpEmployeeEntity)
    private readonly erpEmployeeRepository: Repository<ErpEmployeeEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async listByPeriod(
    periodId: string,
    query: ListKpiAssignmentsQueryDto,
  ): Promise<KpiAssignmentListResponse> {
    const period = await this.findPeriodOrFail(periodId);
    const month = periodLabel(period);
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const [[assignments, total], matching, salaries] = await Promise.all([
      this.listedPlans(period.id, query)
        .addSelect('employee')
        // Query builders skip eager relations; the list shows each employee's avatar.
        .leftJoinAndSelect('employee.avatar', 'avatar')
        .orderBy('employee.firstname', 'ASC')
        .addOrderBy('employee.lastname', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount(),
      // The totals cover every plan the search keeps, not only this page (ADR-067).
      this.listedPlans(period.id, query)
        .select(['assignment.id', 'assignment.employeeId', 'assignment.totalScore'])
        .getMany(),
      this.loadPeriodSalaries(period.id),
    ]);
    const stats = await this.loadItemStats(assignments.map((assignment) => assignment.id));
    const payoutOf = (plan: KpiAssignmentEntity) =>
      this.planPayout(salaries, plan.employeeId, month, plan.totalScore);

    return {
      items: assignments.map((assignment) =>
        toKpiAssignmentSummary(
          assignment,
          this.readEmployee(assignment),
          stats.get(assignment.id.toLowerCase()),
          payoutOf(assignment),
        ),
      ),
      limit,
      page,
      total,
      salarySummary: toKpiSalarySummary(matching.map(payoutOf)),
    };
  }

  /** Copies the template's rows to every selected employee as their plan for the period. */
  async assign(
    periodId: string,
    dto: AssignKpiTemplateDto,
  ): Promise<KpiAssignmentSummaryResponse[]> {
    const period = await this.findOpenPeriodOrFail(periodId);
    const template = await this.templateRepository.findOneBy({ id: dto.templateId });

    if (!template || !template.isActive) {
      throw kpiAssignmentBadRequest(
        'KPI_ASSIGNMENT_UNKNOWN_TEMPLATE',
        'templateId is not an active KPI template.',
      );
    }

    const templateItems = await this.loadTemplateItems(template.id);

    if (templateItems.length === 0) {
      throw kpiAssignmentBadRequest(
        'KPI_ASSIGNMENT_EMPTY_TEMPLATE',
        'The KPI template has no rows to assign.',
      );
    }

    const employees = await this.loadEmployeesInOrder(dto.employeeIds);
    const ineligible = findIneligibleEmployees(await this.withFirmLinks(employees), {
      requiresErpLink: requiresErpLink(templateItems.map((item) => item.scope)),
    });

    if (ineligible.length > 0) {
      throw kpiAssignmentBadRequest(
        'KPI_ASSIGNMENT_INELIGIBLE',
        'Some employees cannot be given this template.',
        { employees: ineligible },
      );
    }

    const taken = await this.assignmentRepository.find({
      select: { employeeId: true },
      where: { periodId: period.id, employeeId: In(employees.map((employee) => employee.id)) },
    });

    if (taken.length > 0) {
      throw kpiAssignmentExists(taken.map((assignment) => assignment.employeeId));
    }

    const items = templateItems.map((item) => ({ ...item }));
    const createdIds = await this.dataSource.transaction(async (manager) => {
      const ids: string[] = [];

      for (const employee of employees) {
        ids.push(
          await this.insertPlan(manager, {
            periodId: period.id,
            employeeId: employee.id,
            templateId: template.id,
            templateName: template.name,
            items,
            context: { via: 'assign-template', period: periodLabel(period) },
          }),
        );
      }

      return ids;
    });

    return this.loadSummaries(period, createdIds);
  }

  /**
   * Copies a period's plans with their targets into this one, each target changed by
   * `targetChangePercent` (ADR-070). Employees who already have a plan, who are no longer
   * active, or who lost their Tiger link are reported back.
   */
  async copyFrom(periodId: string, dto: CopyKpiAssignmentsDto): Promise<KpiAssignmentCopyResponse> {
    const period = await this.findOpenPeriodOrFail(periodId);
    const source = await this.findPeriodOrFail(dto.sourcePeriodId);
    const targetChangePercent = dto.targetChangePercent ?? 0;

    if (source.id.toLowerCase() === period.id.toLowerCase()) {
      throw new BadRequestException('sourcePeriodId must be a different period.');
    }

    const sourceAssignments = await this.assignmentRepository.find({
      where: { periodId: source.id },
      relations: { employee: { avatar: true } },
      order: { createdAt: 'ASC' },
    });
    const taken = new Set(
      (
        await this.assignmentRepository.find({
          select: { employeeId: true },
          where: { periodId: period.id },
        })
      ).map((assignment) => assignment.employeeId.toLowerCase()),
    );
    const itemsByAssignment = await this.loadItemsOf(
      sourceAssignments.map((assignment) => assignment.id),
    );
    const skipped: KpiAssignmentSkippedResponse[] = [];
    const copies: Array<{ assignment: KpiAssignmentEntity; items: LoggedItem[] }> = [];
    const salespeople = await loadFirmSalespersonIds(
      this.erpEmployeeRepository,
      sourceAssignments.map((assignment) => assignment.employee?.erpEmployeeId),
    );

    for (const assignment of sourceAssignments) {
      const employee = this.readEmployee(assignment);
      const items = itemsByAssignment.get(assignment.id.toLowerCase()) ?? [];
      const [problem] = findIneligibleEmployees([firmLinked(employee, salespeople)], {
        requiresErpLink: requiresErpLink(items.map((item) => item.scope)),
      });

      if (taken.has(employee.id.toLowerCase())) {
        skipped.push({ employeeId: employee.id, reason: 'already-assigned' });
      } else if (problem) {
        skipped.push({ employeeId: employee.id, reason: problem.reason });
      } else {
        copies.push({
          assignment,
          items: items.map((item) => ({
            ...item,
            targetValue: changeTarget(item.targetValue, targetChangePercent, item.unit),
          })),
        });
      }
    }

    if (copies.length > 0) {
      await this.dataSource.transaction(async (manager) => {
        for (const copy of copies) {
          await this.insertPlan(manager, {
            periodId: period.id,
            employeeId: copy.assignment.employeeId,
            templateId: copy.assignment.templateId,
            templateName: copy.assignment.templateName,
            items: copy.items,
            context: {
              via: 'copy-assignments',
              period: periodLabel(period),
              copiedFrom: periodLabel(source),
              ...(targetChangePercent === 0 ? {} : { targetChangePercent }),
            },
          });
        }
      });
    }

    return { created: copies.length, skipped };
  }

  async get(id: string): Promise<KpiAssignmentResponse> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: { employee: { avatar: true }, period: true },
    });

    if (!assignment) {
      throw new NotFoundException('KPI plan not found.');
    }

    return this.toResponse(assignment);
  }

  /** The employee's own plan: the asked month, or the newest one when no month is given. */
  async getMine(
    employeeId: string,
    query: MyKpiPlanQueryDto,
  ): Promise<KpiAssignmentResponse | null> {
    const builder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.employee', 'employee')
      .leftJoinAndSelect('employee.avatar', 'avatar')
      .innerJoinAndSelect('assignment.period', 'period')
      .where('assignment.employeeId = :employeeId', { employeeId })
      .orderBy('period.year', 'DESC')
      .addOrderBy('period.month', 'DESC');

    if (query.year !== undefined && query.month !== undefined) {
      builder
        .andWhere('period.year = :year', { year: query.year })
        .andWhere('period.month = :month', { month: query.month });
    }

    const assignment = await builder.getOne();

    return assignment ? this.toResponse(assignment) : null;
  }

  /** The periods the employee has a plan in, newest first: the My KPI screen's period list. */
  async listMyPeriods(
    employeeId: string,
    query: ListMyKpiPeriodsQueryDto,
  ): Promise<KpiMyPeriodListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? MY_PERIODS_PAGE_SIZE;
    const [assignments, total] = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.period', 'period')
      .where('assignment.employeeId = :employeeId', { employeeId })
      .orderBy('period.year', 'DESC')
      .addOrderBy('period.month', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    // One read of the employee's salaries serves every month of the page (ADR-049).
    const salaries = await this.salaryRepository.find({ where: { employeeId } });

    return {
      items: assignments.map((assignment) => {
        const period = this.readPeriod(assignment);
        const salary = salaryInForce(salaries, periodLabel(period));

        return toKpiMyPeriod(
          assignment,
          period,
          salary ? toSalaryPayout(salary, assignment.totalScore) : null,
        );
      }),
      limit,
      page,
      total,
    };
  }

  /** Writes the targets of the sent rows; nothing else in a plan can change (ADR-039). */
  async setTargets(id: string, dto: SaveKpiTargetsDto): Promise<KpiAssignmentResponse> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: { employee: { avatar: true }, period: true },
    });

    if (!assignment) {
      throw new NotFoundException('KPI plan not found.');
    }

    const period = assignment.period;

    if (!period || !isPeriodOpen(period)) {
      throw kpiPeriodClosed(period ? periodLabel(period) : '?');
    }

    const items = await this.loadPlanItems(this.dataSource.manager, assignment.id);
    const byId = new Map(items.map((item) => [item.id.toLowerCase(), item]));
    const targets = new Map<string, number | null>();

    for (const target of dto.items) {
      const item = byId.get(target.id.toLowerCase());

      if (!item) {
        throw kpiAssignmentBadRequest(
          'KPI_ASSIGNMENT_UNKNOWN_ITEM',
          'items[] holds a row of another plan.',
          { itemId: target.id },
        );
      }

      const value = target.targetValue ?? null;
      const problem = findTargetProblem(value, item.unit);

      if (problem) {
        throw kpiAssignmentBadRequest(
          'KPI_ASSIGNMENT_INVALID_TARGET',
          `The target of ${item.code} is invalid (${problem}).`,
          { itemId: item.id, problem },
        );
      }

      targets.set(item.id.toLowerCase(), value);
    }

    const changed = items.filter(
      (item) =>
        targets.has(item.id.toLowerCase()) &&
        (targets.get(item.id.toLowerCase()) ?? null) !== item.targetValue,
    );

    if (changed.length > 0) {
      const before = toItemSnapshots(items);
      const after = toItemSnapshots(
        items.map((item) =>
          targets.has(item.id.toLowerCase())
            ? { ...item, targetValue: targets.get(item.id.toLowerCase()) ?? null }
            : item,
        ),
      );

      await this.dataSource.transaction(async (manager) => {
        for (const item of changed) {
          await this.audit.update(
            manager,
            KpiAssignmentItemEntity,
            { id: item.id },
            { targetValue: targets.get(item.id.toLowerCase()) ?? null },
            { log: false },
          );
        }

        // The plan's own entry carries the rows; the rows are not logged one by one.
        await this.audit.update(
          manager,
          KpiAssignmentEntity,
          { id: assignment.id },
          {},
          { extraChanges: { items: { old: before, new: after } } },
        );
      });
    }

    return this.get(assignment.id);
  }

  /** Removing a plan is only possible while the period is open. */
  async remove(id: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: { period: true },
    });

    if (!assignment) {
      throw new NotFoundException('KPI plan not found.');
    }

    if (!assignment.period || !isPeriodOpen(assignment.period)) {
      throw kpiPeriodClosed(assignment.period ? periodLabel(assignment.period) : '?');
    }

    const items = await this.loadPlanItems(this.dataSource.manager, assignment.id);

    await this.dataSource.transaction(async (manager) => {
      // The results hang on the plan's rows (ADR-041), so they go first; like the rows
      // themselves they are not logged one by one, the plan's own entry carries them.
      await this.audit.delete(
        manager,
        KpiResultEntity,
        { assignmentId: assignment.id },
        { log: false },
      );
      await this.audit.delete(
        manager,
        KpiAssignmentItemEntity,
        { assignmentId: assignment.id },
        {
          log: false,
        },
      );
      await this.audit.delete(
        manager,
        KpiAssignmentEntity,
        { id: assignment.id },
        { extraChanges: { items: { old: toItemSnapshots(items) } } },
      );
    });
  }

  private async insertPlan(
    manager: EntityManager,
    plan: {
      periodId: string;
      employeeId: string;
      templateId: string;
      templateName: string;
      items: readonly LoggedItem[];
      context: Record<string, AuditValue>;
    },
  ): Promise<string> {
    const items = planItemsFromTemplate(plan.items);
    const assignment = await this.audit.insert(
      manager,
      KpiAssignmentEntity,
      {
        periodId: plan.periodId,
        employeeId: plan.employeeId,
        templateId: plan.templateId,
        templateName: plan.templateName,
      },
      {
        context: plan.context,
        extraChanges: { items: { new: toItemSnapshots(plan.items) } },
      },
    );

    await this.audit.insertMany(
      manager,
      KpiAssignmentItemEntity,
      items.map((item) => ({
        assignmentId: assignment.id,
        inputValues: item.inputValues,
        kpiDefinitionId: item.kpiDefinitionId,
        sortOrder: item.sortOrder,
        targetValue: item.targetValue,
        weight: item.weight,
      })),
      { log: false },
    );

    return assignment.id;
  }

  private async toResponse(assignment: KpiAssignmentEntity): Promise<KpiAssignmentResponse> {
    const period = assignment.period ?? (await this.findPeriodOrFail(assignment.periodId));
    const items = await this.itemRepository.find({
      where: { assignmentId: assignment.id },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });

    return toKpiAssignmentResponse(assignment, period, this.readEmployee(assignment), items);
  }

  private async loadSummaries(
    period: KpiPeriodEntity,
    ids: string[],
  ): Promise<KpiAssignmentSummaryResponse[]> {
    if (ids.length === 0) {
      return [];
    }

    const [assignments, stats, salaries] = await Promise.all([
      this.assignmentRepository.find({
        where: { id: In(ids) },
        relations: { employee: { avatar: true } },
      }),
      this.loadItemStats(ids),
      this.loadPeriodSalaries(period.id),
    ]);
    const byId = new Map(
      assignments.map((assignment) => [assignment.id.toLowerCase(), assignment]),
    );

    return ids.flatMap((id) => {
      const assignment = byId.get(id.toLowerCase());

      return assignment
        ? [
            toKpiAssignmentSummary(
              assignment,
              this.readEmployee(assignment),
              stats.get(id.toLowerCase()),
              this.planPayout(
                salaries,
                assignment.employeeId,
                periodLabel(period),
                assignment.totalScore,
              ),
            ),
          ]
        : [];
    });
  }

  /** The period's plans that the list's search and template filter keep. */
  private listedPlans(periodId: string, query: ListKpiAssignmentsQueryDto) {
    const builder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.employee', 'employee')
      .where('assignment.periodId = :periodId', { periodId });

    if (query.templateId !== undefined) {
      builder.andWhere('assignment.templateId = :templateId', { templateId: query.templateId });
    }

    andWhereEachSearchTerm(builder, query.search, [
      (parameter) => `employee.firstname COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
      (parameter) => `employee.lastname COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
      (parameter) => `employee.username COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
    ]);

    return builder;
  }

  /**
   * Every salary of the employees with a plan in the period, by lower-cased employee id.
   * One read serves the whole list; the month picks the salary in force (ADR-049).
   */
  private async loadPeriodSalaries(periodId: string): Promise<Map<string, EmployeeSalaryEntity[]>> {
    const rows = await this.salaryRepository
      .createQueryBuilder('salary')
      .innerJoin(
        KpiAssignmentEntity,
        'plan',
        'plan.employeeId = salary.employeeId AND plan.periodId = :periodId',
        { periodId },
      )
      .getMany();
    const byEmployee = new Map<string, EmployeeSalaryEntity[]>();

    for (const row of rows) {
      const key = row.employeeId.toLowerCase();
      byEmployee.set(key, [...(byEmployee.get(key) ?? []), row]);
    }

    return byEmployee;
  }

  private planPayout(
    salaries: Map<string, EmployeeSalaryEntity[]>,
    employeeId: string,
    month: string,
    totalScore: number | null,
  ): SalaryPayoutResponse | null {
    const salary = salaryInForce(salaries.get(employeeId.toLowerCase()) ?? [], month);

    return salary ? toSalaryPayout(salary, totalScore) : null;
  }

  private readEmployee(assignment: KpiAssignmentEntity): EmployeeEntity {
    if (!assignment.employee) {
      throw new Error(`kpi_assignments[${assignment.id}] was loaded without its employee.`);
    }

    return assignment.employee;
  }

  private readPeriod(assignment: KpiAssignmentEntity): KpiPeriodEntity {
    if (!assignment.period) {
      throw new Error(`kpi_assignments[${assignment.id}] was loaded without its period.`);
    }

    return assignment.period;
  }

  private async findPeriodOrFail(id: string): Promise<KpiPeriodEntity> {
    const period = await this.periodRepository.findOneBy({ id });

    if (!period) {
      throw new NotFoundException('KPI period not found.');
    }

    return period;
  }

  private async findOpenPeriodOrFail(id: string): Promise<KpiPeriodEntity> {
    const period = await this.findPeriodOrFail(id);

    if (!isPeriodOpen(period)) {
      throw kpiPeriodClosed(periodLabel(period));
    }

    return period;
  }

  /**
   * The employees with their Tiger link kept only when it is a salesperson of the configured
   * firm, so a link to another firm is refused like a missing one ("missing-erp-link").
   */
  private async withFirmLinks(employees: EmployeeEntity[]): Promise<AssignableEmployee[]> {
    const salespeople = await loadFirmSalespersonIds(
      this.erpEmployeeRepository,
      employees.map((employee) => employee.erpEmployeeId),
    );

    return employees.map((employee) => firmLinked(employee, salespeople));
  }

  private async loadEmployeesInOrder(ids: string[]): Promise<EmployeeEntity[]> {
    const employees = await this.employeeRepository.find({ where: { id: In(ids) } });
    const byId = new Map(employees.map((employee) => [employee.id.toLowerCase(), employee]));
    const missing = ids.filter((id) => !byId.has(id.toLowerCase()));

    if (missing.length > 0) {
      throw new NotFoundException(`Employees not found: ${missing.join(', ')}.`);
    }

    return ids.flatMap((id) => {
      const employee = byId.get(id.toLowerCase());

      return employee ? [employee] : [];
    });
  }

  /** Template rows with what the plan needs from their definition (scope, unit, name). */
  private async loadTemplateItems(templateId: string): Promise<Array<LoggedItem & ItemMeta>> {
    const items = await this.templateItemRepository.find({
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
        scope: item.definition.scope,
        sortOrder: item.sortOrder,
        targetValue: item.targetValue,
        unit: item.definition.unit,
        weight: item.weight,
      };
    });
  }

  private async loadPlanItems(
    manager: EntityManager,
    assignmentId: string,
  ): Promise<Array<LoggedItem & ItemMeta & { id: string }>> {
    const items = await manager.getRepository(KpiAssignmentItemEntity).find({
      where: { assignmentId },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });

    return items.map((item) => {
      if (!item.definition) {
        throw new Error(`kpi_assignment_items[${item.id}] was loaded without its definition.`);
      }

      return {
        code: item.definition.code,
        id: item.id,
        inputValues: item.inputValues,
        kpiDefinitionId: item.kpiDefinitionId,
        name: readKpiDefinitionName(item.definition),
        scope: item.definition.scope,
        sortOrder: item.sortOrder,
        targetValue: item.targetValue,
        unit: item.definition.unit,
        weight: item.weight,
      };
    });
  }

  /** Rows of several plans at once, for copying a whole period. */
  private async loadItemsOf(
    assignmentIds: string[],
  ): Promise<Map<string, Array<LoggedItem & ItemMeta>>> {
    if (assignmentIds.length === 0) {
      return new Map();
    }

    const items = await this.itemRepository.find({
      where: { assignmentId: In(assignmentIds) },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });
    const byAssignment = new Map<string, Array<LoggedItem & ItemMeta>>();

    for (const item of items) {
      if (!item.definition) {
        throw new Error(`kpi_assignment_items[${item.id}] was loaded without its definition.`);
      }

      const key = item.assignmentId.toLowerCase();
      const list = byAssignment.get(key) ?? [];

      list.push({
        code: item.definition.code,
        inputValues: item.inputValues,
        kpiDefinitionId: item.kpiDefinitionId,
        name: readKpiDefinitionName(item.definition),
        scope: item.definition.scope,
        sortOrder: item.sortOrder,
        targetValue: item.targetValue,
        unit: item.definition.unit,
        weight: item.weight,
      });
      byAssignment.set(key, list);
    }

    return byAssignment;
  }

  /** One grouped query for the whole page instead of one per plan. */
  private async loadItemStats(ids: string[]): Promise<Map<string, KpiAssignmentItemStats>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.itemRepository
      .createQueryBuilder('item')
      .select('item.assignmentId', 'assignmentId')
      .addSelect('COUNT(*)', 'itemCount')
      .addSelect('COUNT(item.target_value)', 'targetCount')
      .where('item.assignmentId IN (:...ids)', { ids })
      .groupBy('item.assignmentId')
      .getRawMany<{ assignmentId: string; itemCount: number; targetCount: number }>();

    return new Map(
      rows.map((row) => [
        row.assignmentId.toLowerCase(),
        { itemCount: Number(row.itemCount), targetCount: Number(row.targetCount) },
      ]),
    );
  }
}

function firmLinked(employee: EmployeeEntity, salespeople: Set<number>): AssignableEmployee {
  return {
    id: employee.id,
    isActive: employee.isActive,
    erpEmployeeId:
      employee.erpEmployeeId !== null && salespeople.has(employee.erpEmployeeId)
        ? employee.erpEmployeeId
        : null,
  };
}
