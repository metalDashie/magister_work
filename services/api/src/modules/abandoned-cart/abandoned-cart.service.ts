import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, MoreThan, IsNull, Not } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { Cart, CartReminder, User, Coupon, CouponType, CouponStatus } from '../../database/entities'
import { EmailService } from '../email/email.service'
import { formatPrice } from '@fullmag/common'

@Injectable()
export class AbandonedCartService {
  private readonly logger = new Logger(AbandonedCartService.name)

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartReminder)
    private cartReminderRepository: Repository<CartReminder>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  // Run every hour to check for abandoned carts
  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedCarts() {
    this.logger.log('Running abandoned cart check...')

    try {
      // Find carts that were updated more than 1 hour ago but less than 7 days ago
      // and have items in them
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const abandonedCarts = await this.cartRepository
        .createQueryBuilder('cart')
        .innerJoinAndSelect('cart.items', 'items')
        .innerJoinAndSelect('items.product', 'product')
        .innerJoinAndSelect('cart.user', 'user')
        .where('cart.updatedAt < :oneHourAgo', { oneHourAgo })
        .andWhere('cart.updatedAt > :sevenDaysAgo', { sevenDaysAgo })
        .andWhere('cart.userId IS NOT NULL')
        .getMany()

      this.logger.log(`Found ${abandonedCarts.length} abandoned carts`)

      for (const cart of abandonedCarts) {
        await this.processAbandonedCart(cart)
      }
    } catch (error) {
      this.logger.error('Error processing abandoned carts:', error)
    }
  }

  private async processAbandonedCart(cart: Cart) {
    if (!cart.user?.email || cart.items.length === 0) {
      return
    }

    // Check if we already sent a reminder for this cart state
    const existingReminder = await this.cartReminderRepository.findOne({
      where: {
        cartId: cart.id,
        sentAt: MoreThan(new Date(cart.updatedAt)),
      },
    })

    if (existingReminder) {
      return // Already sent reminder for current cart state
    }

    // Count existing reminders for this cart
    const reminderCount = await this.cartReminderRepository.count({
      where: { cartId: cart.id },
    })

    // Limit to 3 reminders per cart
    if (reminderCount >= 3) {
      return
    }

    // Send reminder email
    const reminderNumber = reminderCount + 1
    const includeDiscount = reminderNumber >= 2 // Include discount on 2nd+ reminder

    let discountCode: string | undefined
    let discountPercent: number | undefined

    if (includeDiscount) {
      // Create a personalized coupon for this user
      const coupon = await this.createAbandonedCartCoupon(cart.userId)
      if (coupon) {
        discountCode = coupon.code
        discountPercent = Number(coupon.value)
      }
    }

    const success = await this.sendAbandonedCartEmail(
      cart,
      discountCode,
      discountPercent
    )

    if (success) {
      // Record the reminder
      const reminder = this.cartReminderRepository.create({
        userId: cart.userId,
        cartId: cart.id,
        reminderNumber,
        emailSent: true,
      })
      await this.cartReminderRepository.save(reminder)
      this.logger.log(`Sent reminder #${reminderNumber} for cart ${cart.id}`)
    }
  }

  private async createAbandonedCartCoupon(userId: string): Promise<Coupon | null> {
    try {
      // Generate unique code
      const code = `RETURN${userId.substring(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`

      // Create coupon valid for 48 hours
      const validUntil = new Date(Date.now() + 48 * 60 * 60 * 1000)

      const coupon = this.couponRepository.create({
        code,
        description: 'Abandoned cart discount',
        type: CouponType.PERCENTAGE,
        value: 10, // 10% discount
        minOrderAmount: null,
        usageLimit: 1,
        timesUsed: 0,
        usageLimitPerUser: 1,
        startDate: new Date(),
        endDate: validUntil,
        status: CouponStatus.ACTIVE,
      })

      return await this.couponRepository.save(coupon)
    } catch (error) {
      this.logger.error('Error creating abandoned cart coupon:', error)
      return null
    }
  }

  private async sendAbandonedCartEmail(
    cart: Cart,
    discountCode?: string,
    discountPercent?: number
  ): Promise<boolean> {
    const items = cart.items.map((item) => ({
      name: item.product?.name || 'Product',
      quantity: item.quantity,
      price: formatPrice(item.price, 'UAH'),
    }))

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    )

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:10002')

    return this.emailService.sendAbandonedCartReminder(
      cart.user.email,
      cart.user.email.split('@')[0] || undefined,
      items,
      formatPrice(totalAmount, 'UAH'),
      `${frontendUrl}/cart`,
      discountCode,
      discountPercent
    )
  }

  // Get abandoned cart stats for admin dashboard
  async getStats() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalAbandoned,
      abandonedToday,
      remindersSentToday,
      remindersSentWeek,
      remindersSentMonth,
    ] = await Promise.all([
      this.getAbandonedCartCount(new Date(0)),
      this.getAbandonedCartCount(oneDayAgo),
      this.cartReminderRepository.count({
        where: { sentAt: MoreThan(oneDayAgo) },
      }),
      this.cartReminderRepository.count({
        where: { sentAt: MoreThan(oneWeekAgo) },
      }),
      this.cartReminderRepository.count({
        where: { sentAt: MoreThan(oneMonthAgo) },
      }),
    ])

    return {
      totalAbandoned,
      abandonedToday,
      remindersSent: {
        today: remindersSentToday,
        week: remindersSentWeek,
        month: remindersSentMonth,
      },
    }
  }

  private async getAbandonedCartCount(since: Date): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    return this.cartRepository
      .createQueryBuilder('cart')
      .innerJoin('cart.items', 'items')
      .where('cart.updatedAt < :oneHourAgo', { oneHourAgo })
      .andWhere('cart.updatedAt > :since', { since })
      .andWhere('cart.userId IS NOT NULL')
      .getCount()
  }

  // Get list of abandoned carts for admin
  async getAbandonedCarts(page: number = 1, limit: number = 20) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [carts, total] = await this.cartRepository
      .createQueryBuilder('cart')
      .innerJoinAndSelect('cart.items', 'items')
      .innerJoinAndSelect('items.product', 'product')
      .innerJoinAndSelect('cart.user', 'user')
      .leftJoinAndSelect(
        CartReminder,
        'reminder',
        'reminder.cartId = cart.id'
      )
      .where('cart.updatedAt < :oneHourAgo', { oneHourAgo })
      .andWhere('cart.updatedAt > :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('cart.userId IS NOT NULL')
      .orderBy('cart.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    // Get reminder counts for each cart
    const cartsWithReminders = await Promise.all(
      carts.map(async (cart) => {
        const reminders = await this.cartReminderRepository.find({
          where: { cartId: cart.id },
          order: { sentAt: 'DESC' },
        })

        const totalValue = cart.items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0
        )

        return {
          id: cart.id,
          user: {
            id: cart.user.id,
            email: cart.user.email,
            name: cart.user.email.split('@')[0] || 'N/A',
          },
          itemCount: cart.items.length,
          totalValue,
          updatedAt: cart.updatedAt,
          remindersSent: reminders.length,
          lastReminderAt: reminders[0]?.sentAt || null,
        }
      })
    )

    return {
      carts: cartsWithReminders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Manually trigger reminder for specific cart
  async sendManualReminder(cartId: string): Promise<boolean> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product', 'user'],
    })

    if (!cart || !cart.user?.email || cart.items.length === 0) {
      return false
    }

    const reminderCount = await this.cartReminderRepository.count({
      where: { cartId: cart.id },
    })

    const includeDiscount = reminderCount >= 1

    let discountCode: string | undefined
    let discountPercent: number | undefined

    if (includeDiscount) {
      const coupon = await this.createAbandonedCartCoupon(cart.userId)
      if (coupon) {
        discountCode = coupon.code
        discountPercent = Number(coupon.value)
      }
    }

    const success = await this.sendAbandonedCartEmail(
      cart,
      discountCode,
      discountPercent
    )

    if (success) {
      const reminder = this.cartReminderRepository.create({
        userId: cart.userId,
        cartId: cart.id,
        reminderNumber: reminderCount + 1,
        emailSent: true,
      })
      await this.cartReminderRepository.save(reminder)
    }

    return success
  }
}
