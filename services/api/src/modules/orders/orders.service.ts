import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order, OrderItem } from '../../database/entities'
import { CreateOrderDto, OrderStatus } from '@fullmag/common'
import { CartService } from '../cart/cart.service'
import { EmailService } from '../email/email.service'

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private cartService: CartService,
    private emailService: EmailService
  ) {}

  async findAll(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items', 'items.product', 'payment'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string, userId: string): Promise<Order | null> {
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

    const newOrder = this.ordersRepository.create({
      userId,
      totalAmount,
      status: OrderStatus.PENDING,
      deliveryType: createOrderDto.deliveryType,
      deliveryCity: createOrderDto.deliveryCity,
      deliveryWarehouse: createOrderDto.deliveryWarehouse,
      deliveryAddress: createOrderDto.deliveryAddress,
      recipientName: createOrderDto.recipientName,
      recipientPhone: createOrderDto.recipientPhone,
    })

    const savedOrder = await this.ordersRepository.save(newOrder)

    const orderItems = createOrderDto.items.map((item) =>
      this.orderItemsRepository.create({
        orderId: savedOrder.id,
        ...item,
      })
    )

    await this.orderItemsRepository.save(orderItems)

    // Clear cart after order creation
    await this.cartService.clearCart(userId)

    const createdOrder = await this.findOne(savedOrder.id, userId)

    // Send order confirmation email
    const user = createdOrder?.user
    if (user?.email && createdOrder) {
      await this.emailService.sendOrderConfirmation(createdOrder, user.email)
    }

    if (!createdOrder) {
      throw new Error('Failed to create order')
    }

    return createdOrder
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user'],
    })

    if (!order) {
      throw new Error('Order not found')
    }

    const oldStatus = order.status
    await this.ordersRepository.update(id, { status })

    const updatedOrder = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payment'],
    })

    if (!updatedOrder) {
      throw new Error('Order not found after update')
    }

    // Send status update email
    if (updatedOrder.user?.email && oldStatus !== status) {
      await this.emailService.sendOrderStatusUpdate(
        updatedOrder,
        updatedOrder.user.email,
        oldStatus,
        status
      )
    }

    return updatedOrder
  }
}
