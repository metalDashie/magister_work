import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Cart, CartItem, Product } from '../../database/entities'
import { AddToCartDto } from '@fullmag/common'

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    })

    if (!cart) {
      cart = this.cartRepository.create({ userId, items: [] })
      await this.cartRepository.save(cart)
    }

    // Ensure items is always an array
    if (!cart.items) {
      cart.items = []
    }

    return cart
  }

  async addItem(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const cart = await this.getCart(userId)

    // Fetch product to get the current price
    const product = await this.productRepository.findOne({
      where: { id: addToCartDto.productId },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    const existingItem = cart.items?.find(
      (item) => item.productId === addToCartDto.productId
    )

    if (existingItem) {
      existingItem.quantity += addToCartDto.quantity
      // Update price to current product price
      existingItem.price = product.price
      await this.cartItemRepository.save(existingItem)
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        price: product.price,
      })
      await this.cartItemRepository.save(newItem)
    }

    return this.getCart(userId)
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await this.getCart(userId)
    const item = cart.items?.find((i) => i.id === itemId)

    if (!item) {
      throw new Error('Cart item not found')
    }

    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      await this.cartItemRepository.delete(itemId)
    } else {
      // Update the quantity
      item.quantity = quantity
      await this.cartItemRepository.save(item)
    }

    return this.getCart(userId)
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    await this.cartItemRepository.delete(itemId)
    return this.getCart(userId)
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId)
    await this.cartItemRepository.delete({ cartId: cart.id })
  }
}
