import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { PaymentStatus, PaymentProvider } from '@fullmag/common'
import { Order } from './order.entity'

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id' })
  orderId: string

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider

  @Column({ name: 'provider_payment_id' })
  providerPaymentId: string

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number

  @Column()
  currency: string

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order: Order

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
