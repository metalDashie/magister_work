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

  // Profile fields
  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName: string | null

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName: string | null

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null

  // Email verification fields
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean

  @Column({ name: 'email_verification_token', type: 'varchar', nullable: true })
  emailVerificationToken: string | null

  @Column({ name: 'email_verification_expires', type: 'timestamp', nullable: true })
  emailVerificationExpires: Date | null

  // Pending email change fields
  @Column({ name: 'pending_email', type: 'varchar', nullable: true })
  pendingEmail: string | null

  @Column({ name: 'pending_email_token', type: 'varchar', nullable: true })
  pendingEmailToken: string | null

  @Column({ name: 'pending_email_expires', type: 'timestamp', nullable: true })
  pendingEmailExpires: Date | null

  // Phone verification fields
  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean

  @Column({ name: 'phone_verification_code', type: 'varchar', nullable: true })
  phoneVerificationCode: string | null

  @Column({ name: 'phone_verification_expires', type: 'timestamp', nullable: true })
  phoneVerificationExpires: Date | null

  // Pending phone change fields
  @Column({ name: 'pending_phone', type: 'varchar', nullable: true })
  pendingPhone: string | null

  @Column({ name: 'pending_phone_code', type: 'varchar', nullable: true })
  pendingPhoneCode: string | null

  @Column({ name: 'pending_phone_expires', type: 'timestamp', nullable: true })
  pendingPhoneExpires: Date | null

  // Password reset fields
  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true })
  passwordResetToken: string | null

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[]

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[]
}
