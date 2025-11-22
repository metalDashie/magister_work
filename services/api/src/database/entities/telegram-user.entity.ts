import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { User } from './user.entity'

@Entity('telegram_users')
export class TelegramUser {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null

  @Column({ name: 'chat_id', type: 'bigint', unique: true })
  chatId: string

  @Column({ name: 'username', type: 'varchar', nullable: true })
  username: string | null

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName: string | null

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ name: 'language_code', type: 'varchar', nullable: true })
  languageCode: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null
}
