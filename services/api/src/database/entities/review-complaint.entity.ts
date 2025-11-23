import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm'
import { User } from './user.entity'
import { Review } from './review.entity'

export enum ComplaintReason {
  SPAM = 'spam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  FALSE_INFORMATION = 'false_information',
  HARASSMENT = 'harassment',
  OFF_TOPIC = 'off_topic',
  ADVERTISING = 'advertising',
  HATE_SPEECH = 'hate_speech',
  PERSONAL_INFORMATION = 'personal_information',
  COPYRIGHT_VIOLATION = 'copyright_violation',
  OTHER = 'other',
}

export enum ComplaintStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('review_complaints')
@Unique(['userId', 'reviewId']) // One complaint per user per review
@Index(['reviewId'])
@Index(['status'])
export class ReviewComplaint {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({
    type: 'enum',
    enum: ComplaintReason,
  })
  reason: ComplaintReason

  @Column({ type: 'text', nullable: true })
  description: string | null // Additional details from user

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.PENDING,
  })
  status: ComplaintStatus

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null // Notes from admin who reviewed

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null // Admin who resolved

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relations
  @ManyToOne(() => Review, (review) => review.complaints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver: User | null
}
