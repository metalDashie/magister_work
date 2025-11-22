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

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  sku: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number

  @Column({ default: 'UAH' })
  currency: string

  @Column({ type: 'int', default: 0 })
  stock: number

  @Column({ name: 'category_id', nullable: true })
  categoryId: number

  @Column({ type: 'simple-array', nullable: true })
  images: string[]

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category

  @OneToMany(() => ProductAttribute, (productAttribute) => productAttribute.product, {
    cascade: true,
  })
  productAttributes: ProductAttribute[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
