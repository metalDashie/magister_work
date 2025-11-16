import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { OrderStatus } from '@fullmag/common'
import { User } from './user.entity'
import { OrderItem } from './order-item.entity'
import { Payment } from './payment.entity'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus

  // Delivery information
  @Column({ name: 'delivery_type', nullable: true })
  deliveryType: string

  @Column({ name: 'delivery_city', nullable: true })
  deliveryCity: string

  @Column({ name: 'delivery_warehouse', nullable: true })
  deliveryWarehouse: string

  @Column({ name: 'delivery_address', nullable: true })
  deliveryAddress: string

  @Column({ name: 'recipient_name', nullable: true })
  recipientName: string

  @Column({ name: 'recipient_phone', nullable: true })
  recipientPhone: string

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[]

  @OneToOne(() => Payment, (payment) => payment.order, { nullable: true })
  payment: Payment

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
