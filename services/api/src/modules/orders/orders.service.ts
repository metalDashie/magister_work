import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order, OrderItem } from '../../database/entities'
import { CreateOrderDto, OrderStatus } from '@fullmag/common'
import { CartService } from '../cart/cart.service'

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private cartService: CartService
  ) {}

  async findAll(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items', 'items.product', 'payment'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string, userId: string): Promise<Order> {
    return this.ordersRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.product', 'payment'],
    })
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const order = this.ordersRepository.create({
      userId,
      totalAmount,
      status: OrderStatus.PENDING,
    })

    const savedOrder = await this.ordersRepository.save(order)

    const orderItems = createOrderDto.items.map((item) =>
      this.orderItemsRepository.create({
        orderId: savedOrder.id,
        ...item,
      })
    )

    await this.orderItemsRepository.save(orderItems)

    // Clear cart after order creation
    await this.cartService.clearCart(userId)

    return this.findOne(savedOrder.id, userId)
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.ordersRepository.update(id, { status })
    return this.ordersRepository.findOne({ where: { id } })
  }
}
