import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from './user.entity'

@Entity('whatsapp_users')
export class WhatsAppUser {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null

  @Column({ name: 'phone_number', type: 'varchar', unique: true })
  phoneNumber: string

  @Column({ name: 'whatsapp_id', type: 'varchar', unique: true })
  whatsappId: string

  @Column({ name: 'push_name', type: 'varchar', nullable: true })
  pushName: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null
}
