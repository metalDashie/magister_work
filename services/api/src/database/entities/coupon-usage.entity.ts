import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './user.entity'
import { Coupon } from './coupon.entity'
import { Order } from './order.entity'

@Entity('coupon_usages')
@Index(['userId', 'couponId'])
@Index(['orderId'])
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'coupon_id', type: 'uuid' })
  couponId: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2 })
  discountAmount: number

  @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
