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

@Entity('user_addresses')
@Index(['userId'])
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 100 })
  title: string // e.g., "Home", "Work", "Mom's house"

  @Column({ name: 'recipient_name', type: 'varchar', length: 255 })
  recipientName: string

  @Column({ name: 'recipient_phone', type: 'varchar', length: 20 })
  recipientPhone: string

  @Column({ type: 'varchar', length: 100 })
  city: string

  @Column({ type: 'text', nullable: true })
  address: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  warehouse: string | null // For Nova Poshta, etc.

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode: string | null

  @Column({ name: 'delivery_type', type: 'varchar', length: 50, default: 'nova_poshta' })
  deliveryType: string

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
