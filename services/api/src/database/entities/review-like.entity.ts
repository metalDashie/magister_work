import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm'
import { User } from './user.entity'
import { Review } from './review.entity'

@Entity('review_likes')
@Unique(['userId', 'reviewId']) // One like per user per review
@Index(['reviewId'])
export class ReviewLike {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Review, (review) => review.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review
}
