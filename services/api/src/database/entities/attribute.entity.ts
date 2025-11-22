import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { Category } from './category.entity'
import { ProductAttribute } from './product-attribute.entity'

export enum AttributeType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RANGE = 'range',
}

export enum AttributeInputType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  RANGE_SLIDER = 'range_slider',
  COLOR_PICKER = 'color_picker',
}

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.STRING,
  })
  type: AttributeType

  @Column({
    type: 'enum',
    enum: AttributeInputType,
    default: AttributeInputType.TEXT,
  })
  inputType: AttributeInputType

  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null // For SELECT and MULTI_SELECT types

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string | null // e.g., "GB", "inches", "MP"

  @Column({ type: 'boolean', default: true })
  isFilterable: boolean

  @Column({ type: 'boolean', default: false })
  isRequired: boolean

  @Column({ type: 'boolean', default: true })
  isVisible: boolean

  @Column({ type: 'int', default: 0 })
  sortOrder: number

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null

  @OneToMany(() => ProductAttribute, (productAttribute) => productAttribute.attribute)
  productAttributes: ProductAttribute[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
