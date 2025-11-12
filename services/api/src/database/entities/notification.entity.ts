import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { NotificationChannel, NotificationStatus } from '@fullmag/common'
import { User } from './user.entity'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel

  @Column({ type: 'jsonb' })
  payload: Record<string, any>

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
