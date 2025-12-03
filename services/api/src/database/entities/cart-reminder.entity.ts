import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './user.entity'
import { Cart } from './cart.entity'

@Entity('cart_reminders')
export class CartReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'cart_id' })
  cartId: string

  @ManyToOne(() => Cart)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart

  @Column({ name: 'reminder_number', default: 1 })
  reminderNumber: number

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date
}
