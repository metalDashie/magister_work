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
import { Product } from './product.entity'

@Entity('wishlists')
@Unique(['userId', 'productId'])
@Index(['userId'])
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
