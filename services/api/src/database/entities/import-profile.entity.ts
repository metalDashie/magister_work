import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './user.entity'

export interface ColumnMapping {
  name?: string | string[]
  sku?: string | string[]
  description?: string | string[]
  price?: string | string[]
  stock?: string | string[]
  category?: string | string[]
  images?: string | string[]
  currency?: string | string[]
}

export interface PriceTransformation {
  type: 'multiply' | 'divide' | 'currency_convert' | 'parse_float'
  value?: number
  sourceCurrency?: string
  targetCurrency?: string
}

export interface CategoryMapping {
  [key: string]: number // External category → Internal categoryId
}

export interface Transformations {
  price?: PriceTransformation
  categoryMapping?: CategoryMapping
}

export interface ValidationRules {
  requireSKU?: boolean
  allowDuplicateSKU?: boolean
  minPrice?: number
  maxPrice?: number
  minStock?: number
  defaultCurrency?: string
  requiredFields?: string[]
}

@Entity('import_profiles')
export class ImportProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', length: 10, default: ',' })
  delimiter: string

  @Column({ type: 'varchar', length: 50, default: 'utf-8' })
  encoding: string

  @Column({ type: 'boolean', default: true })
  hasHeader: boolean

  @Column({ type: 'jsonb' })
  columnMapping: ColumnMapping

  @Column({ type: 'jsonb', nullable: true })
  transformations: Transformations

  @Column({ type: 'jsonb', nullable: true })
  validationRules: ValidationRules

  @Column({ type: 'boolean', default: false })
  isDefault: boolean

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'uuid', nullable: true })
  createdById: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
