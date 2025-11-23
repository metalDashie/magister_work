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
import { Review } from './review.entity'

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

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[]

  @Column({ name: 'average_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  averageRating: number | null

  @Column({ name: 'reviews_count', type: 'int', default: 0 })
  reviewsCount: number

  // Discount fields
  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number | null

  @Column({ name: 'discount_start_date', type: 'timestamp', nullable: true })
  discountStartDate: Date | null

  @Column({ name: 'discount_end_date', type: 'timestamp', nullable: true })
  discountEndDate: Date | null

  @Column({ name: 'discount_active', type: 'boolean', default: false })
  discountActive: boolean

  // Computed getter for final price after discount
  get finalPrice(): number {
    if (!this.isDiscountValid()) {
      return Number(this.price)
    }
    const discount = Number(this.discountPercent) || 0
    return Number(this.price) * (1 - discount / 100)
  }

  // Check if discount is currently valid
  isDiscountValid(): boolean {
    if (!this.discountActive || !this.discountPercent) {
      return false
    }
    const now = new Date()
    if (this.discountStartDate && now < this.discountStartDate) {
      return false
    }
    if (this.discountEndDate && now > this.discountEndDate) {
      return false
    }
    return true
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
