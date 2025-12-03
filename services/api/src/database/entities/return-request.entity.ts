import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './user.entity'
import { Order } from './order.entity'
import { OrderItem } from './order-item.entity'

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DAMAGED_IN_SHIPPING = 'damaged_in_shipping',
  OTHER = 'other',
}

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  COMPLETED = 'completed',
}

@Entity('return_requests')
@Index(['orderId'])
@Index(['userId'])
@Index(['status'])
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'order_item_id', type: 'uuid', nullable: true })
  orderItemId: string | null

  @Column({
    type: 'enum',
    enum: ReturnReason,
  })
  reason: ReturnReason

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null

  @Column({ type: 'int', default: 1 })
  quantity: number

  @Column({ name: 'refund_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  refundAmount: number | null

  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.PENDING,
  })
  status: ReturnStatus

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy: string | null

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => OrderItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by' })
  processor: User | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
