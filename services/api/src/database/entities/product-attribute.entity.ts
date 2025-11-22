import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Product } from './product.entity'
import { Attribute } from './attribute.entity'

@Entity('product_attributes')
@Index(['productId', 'attributeId'], { unique: true })
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  productId: string

  @Column({ type: 'uuid' })
  attributeId: string

  @Column({ type: 'jsonb' })
  value: any // Can be string, number, boolean, array, or object depending on attribute type

  @ManyToOne(() => Product, (product) => product.productAttributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product

  @ManyToOne(() => Attribute, (attribute) => attribute.productAttributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
