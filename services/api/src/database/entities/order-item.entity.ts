import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Order } from './order.entity'
import { Product } from './product.entity'

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id' })
  orderId: string

  @Column({ name: 'product_id' })
  productId: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product
}
