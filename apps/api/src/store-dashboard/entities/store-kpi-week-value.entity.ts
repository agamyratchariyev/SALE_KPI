import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';

/**
 * What one store did in one Monday-to-Sunday week for one store KPI (migration 1799705200000,
 * ADR-071): a copy of `dbo.kpi_store_week_values` and of the week's measured conversion that
 * the weekly dashboard reads instead of Tiger. Only StoreDashboardRefreshService writes it,
 * as the system.
 */
@Entity({ name: 'store_kpi_week_values', schema: 'dbo' })
@Index('UX_store_kpi_week_values_key', ['firmNr', 'weekStart', 'storeNr', 'kpiCode', 'currency'], {
  unique: true,
})
export class StoreKpiWeekValueEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'firm_nr', type: 'int' })
  firmNr: number;

  /** Tiger iş yeri number (`INVOICE.BRANCH` = `L_CAPIDIV.NR`), an external reference. */
  @Column({ name: 'store_nr', type: 'int' })
  storeNr: number;

  /** The Monday of the week, `YYYY-MM-DD`; read in UTC like every other date (useUTC). */
  @Column({ name: 'week_start', type: 'date', utc: true })
  weekStart: string;

  @Column({ name: 'kpi_code', type: 'nvarchar', length: 64 })
  kpiCode: string;

  /** `TMT` / `USD` for sales; null for the counts. */
  @Column({ name: 'currency', type: 'nvarchar', length: 3, nullable: true })
  currency: string | null;

  @Column({
    name: 'value',
    type: 'decimal',
    precision: 19,
    scale: 4,
    transformer: decimalTransformer,
  })
  value: number;

  /** Rates only (the conversion): the receipts of the counted days. */
  @Column({
    name: 'numerator',
    type: 'decimal',
    precision: 19,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  numerator: number | null;

  /** Rates only: the visitors of the counted days. */
  @Column({
    name: 'denominator',
    type: 'decimal',
    precision: 19,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  denominator: number | null;
}
