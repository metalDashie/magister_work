import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm'
import { User } from './user.entity'
import { Product } from './product.entity'
import { ReviewLike } from './review-like.entity'
import { ReviewReply } from './review-reply.entity'
import { ReviewComplaint } from './review-complaint.entity'

@Entity('reviews')
@Unique(['userId', 'productId']) // One review per user per product
@Index(['productId'])
@Index(['userId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string

  @Column({ type: 'int' })
  rating: number // 1-5 stars

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null // Optional review images

  @Column({ name: 'is_verified_purchase', type: 'boolean', default: false })
  isVerifiedPurchase: boolean // User actually bought the product

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible: boolean // Can be hidden by admin

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number

  @Column({ name: 'replies_count', type: 'int', default: 0 })
  repliesCount: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product

  @OneToMany(() => ReviewLike, (like) => like.review)
  likes: ReviewLike[]

  @OneToMany(() => ReviewReply, (reply) => reply.review)
  replies: ReviewReply[]

  @OneToMany(() => ReviewComplaint, (complaint) => complaint.review)
  complaints: ReviewComplaint[]
}
