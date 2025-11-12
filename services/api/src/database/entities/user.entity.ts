import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { UserRole } from '@fullmag/common'
import { Order } from './order.entity'
import { Cart } from './cart.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column({ nullable: true })
  phone: string

  @Column({ name: 'password_hash' })
  passwordHash: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[]

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[]
}
