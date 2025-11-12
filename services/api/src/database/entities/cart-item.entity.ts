import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Cart } from './cart.entity'
import { Product } from './product.entity'

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'cart_id' })
  cartId: string

  @Column({ name: 'product_id' })
  productId: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product
}
