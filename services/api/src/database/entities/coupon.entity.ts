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
import { User } from './user.entity'

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('coupons')
@Index(['code'], { unique: true })
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number // Percentage (0-100) or fixed amount

  @Column({ name: 'min_order_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  minOrderAmount: number | null

  @Column({ name: 'max_discount_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  maxDiscountAmount: number | null // Cap for percentage discounts

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null // Total times coupon can be used

  @Column({ name: 'usage_limit_per_user', type: 'int', default: 1 })
  usageLimitPerUser: number

  @Column({ name: 'times_used', type: 'int', default: 0 })
  timesUsed: number

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  isValid(): boolean {
    if (this.status !== CouponStatus.ACTIVE) return false
    const now = new Date()
    if (this.startDate && now < this.startDate) return false
    if (this.endDate && now > this.endDate) return false
    if (this.usageLimit && this.timesUsed >= this.usageLimit) return false
    return true
  }
}
