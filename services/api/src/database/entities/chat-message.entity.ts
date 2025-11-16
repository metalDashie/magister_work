import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { ChatRoom } from './chat-room.entity'
import { User } from './user.entity'

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'chat_room_id' })
  chatRoomId: string

  @Column({ name: 'sender_id' })
  senderId: string

  @Column({ type: 'text' })
  message: string

  @Column({ name: 'is_read', default: false })
  isRead: boolean

  @Column({ name: 'is_from_support', default: false })
  isFromSupport: boolean

  @ManyToOne(() => ChatRoom, (room) => room.messages)
  @JoinColumn({ name: 'chat_room_id' })
  chatRoom: ChatRoom

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
