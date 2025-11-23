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
import { Review } from './review.entity'

@Entity('review_replies')
@Index(['reviewId'])
@Index(['userId'])
export class ReviewReply {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'parent_reply_id', type: 'uuid', nullable: true })
  parentReplyId: string | null // For nested replies

  @Column({ type: 'text' })
  content: string

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relations
  @ManyToOne(() => Review, (review) => review.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => ReviewReply, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_reply_id' })
  parentReply: ReviewReply | null
}
