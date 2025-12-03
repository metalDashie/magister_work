import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Stripe from 'stripe'
import { Payment, Order } from '../../database/entities'
import { PaymentStatus, PaymentProvider, OrderStatus } from '@fullmag/common'

@Injectable()
export class PaymentsService {
  private stripe: Stripe

  constructor(
    private configService: ConfigService,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY')
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      })
    }
  }

  /**
   * Create a Stripe Payment Intent for an order
   */
  async createPaymentIntent(orderId: string, userId: string): Promise<{
    clientSecret: string
    paymentIntentId: string
  }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured')
    }

    // Get the order
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'items.product'],
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId },
    })

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Order already paid')
    }

    // Create Stripe Payment Intent
    // Stripe expects amount in smallest currency unit (cents for USD, kopecks for UAH)
    const amount = Math.round(Number(order.totalAmount) * 100)

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'uah',
      metadata: {
        orderId: order.id,
        userId: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create or update payment record
    if (existingPayment) {
      existingPayment.providerPaymentId = paymentIntent.id
      existingPayment.status = PaymentStatus.PENDING
      await this.paymentRepository.save(existingPayment)
    } else {
      const payment = this.paymentRepository.create({
        orderId,
        provider: PaymentProvider.STRIPE,
        providerPaymentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        amount: order.totalAmount,
        currency: 'UAH',
      })
      await this.paymentRepository.save(payment)
    }

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  }

  /**
   * Confirm payment was successful (called after frontend confirmation)
   */
  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured')
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

    // Find our payment record
    const payment = await this.paymentRepository.findOne({
      where: { providerPaymentId: paymentIntentId },
      relations: ['order'],
    })

    if (!payment) {
      throw new BadRequestException('Payment not found')
    }

    // Update status based on Stripe status
    if (paymentIntent.status === 'succeeded') {
      payment.status = PaymentStatus.SUCCESS

      // Update order status to PAID
      await this.orderRepository.update(payment.orderId, {
        status: OrderStatus.PAID,
      })
    } else if (paymentIntent.status === 'canceled') {
      payment.status = PaymentStatus.FAILED
    }

    await this.paymentRepository.save(payment)

    return payment
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured')
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured')
    }

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await this.handlePaymentSuccess(paymentIntent.id)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await this.handlePaymentFailed(paymentIntent.id)
        break
      }
    }
  }

  private async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { providerPaymentId: paymentIntentId },
    })

    if (payment) {
      payment.status = PaymentStatus.SUCCESS
      await this.paymentRepository.save(payment)

      // Update order status
      await this.orderRepository.update(payment.orderId, {
        status: OrderStatus.PAID,
      })
    }
  }

  private async handlePaymentFailed(paymentIntentId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { providerPaymentId: paymentIntentId },
    })

    if (payment) {
      payment.status = PaymentStatus.FAILED
      await this.paymentRepository.save(payment)
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { orderId },
    })
  }

  /**
   * Get Stripe publishable key for frontend
   */
  getPublishableKey(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || ''
  }

  /**
   * Find payment by provider payment ID
   */
  async findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { providerPaymentId },
    })
  }

  /**
   * Update payment status by provider payment ID
   */
  async updatePaymentStatus(providerPaymentId: string, status: PaymentStatus): Promise<void> {
    await this.paymentRepository.update(
      { providerPaymentId },
      { status }
    )
  }
}
