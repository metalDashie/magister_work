import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order, OrderItem } from '../../database/entities'
import { CreateOrderDto, OrderStatus, PaymentMethod } from '@fullmag/common'
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

  async findAllAdmin(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user', 'items', 'items.product', 'payment'],
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

    // Determine order status based on payment method
    // If online payment, set to PAID (simulated payment success)
    // If cash on delivery, set to PENDING
    const paymentMethod = createOrderDto.paymentMethod || PaymentMethod.ONLINE
    const orderStatus = paymentMethod === PaymentMethod.ONLINE
      ? OrderStatus.PAID
      : OrderStatus.PENDING

    const newOrder = this.ordersRepository.create({
      userId,
      totalAmount,
      status: orderStatus,
      paymentMethod: paymentMethod,
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

    // Fetch the complete order with user relation for email
    const createdOrder = await this.ordersRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'payment', 'user'],
    })

    if (!createdOrder) {
      throw new Error('Failed to create order')
    }

    // Send order confirmation email
    if (createdOrder.user?.email) {
      await this.emailService.sendOrderConfirmation(createdOrder, createdOrder.user.email)
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
    const userEmail = order.user?.email

    await this.ordersRepository.update(id, { status })

    const updatedOrder = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payment', 'user'],
    })

    if (!updatedOrder) {
      throw new Error('Order not found after update')
    }

    // Send status update email
    if (userEmail && oldStatus !== status) {
      await this.emailService.sendOrderStatusUpdate(
        updatedOrder,
        userEmail,
        oldStatus,
        status
      )
    }

    return updatedOrder
  }
}
