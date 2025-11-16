import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { User } from './user.entity'
import { ChatMessage } from './chat-message.entity'

export enum ChatRoomStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  WAITING = 'waiting',
}

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({ name: 'support_agent_id', nullable: true })
  supportAgentId: string

  @Column({
    type: 'enum',
    enum: ChatRoomStatus,
    default: ChatRoomStatus.WAITING,
  })
  status: ChatRoomStatus

  @Column({ name: 'last_message', type: 'text', nullable: true })
  lastMessage: string

  @Column({ name: 'unread_count', default: 0 })
  unreadCount: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'support_agent_id' })
  supportAgent: User

  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
