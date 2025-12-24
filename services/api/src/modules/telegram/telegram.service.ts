import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import TelegramBot = require('node-telegram-bot-api')
import { TelegramUser } from '../../database/entities/telegram-user.entity'
import { User } from '../../database/entities/user.entity'
import { Cart } from '../../database/entities/cart.entity'
import { Coupon, CouponStatus } from '../../database/entities/coupon.entity'
import { Order } from '../../database/entities/order.entity'
import { Product } from '../../database/entities/product.entity'
import { formatPrice } from '@fullmag/common'

export interface BroadcastMessageDto {
  message: string
  userIds?: string[] // If specified, send only to these users
  sendToAll?: boolean // If true, send to all active telegram users
}

export interface PersonalMessageDto {
  userId: string
  message: string
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot | null = null
  private readonly logger = new Logger(TelegramService.name)
  private readonly botEnabled: boolean
  private readonly usePolling: boolean

  constructor(
    @InjectRepository(TelegramUser)
    private telegramUserRepo: Repository<TelegramUser>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private configService: ConfigService,
  ) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')
    this.botEnabled = !!botToken
    this.usePolling = this.configService.get<string>('TELEGRAM_USE_POLLING') === 'true'

    if (this.botEnabled && botToken) {
      this.bot = new TelegramBot(botToken, { polling: this.usePolling })
      this.logger.log(`Telegram bot initialized (polling: ${this.usePolling})`)

      // Setup message handler for polling mode
      if (this.usePolling) {
        this.setupPollingHandlers()
      }
    } else {
      this.logger.warn(
        'Telegram bot is disabled. Set TELEGRAM_BOT_TOKEN to enable.',
      )
    }
  }

  async onModuleInit() {
    if (this.bot && this.botEnabled && !this.usePolling) {
      await this.setupWebhook()
    }
  }

  /**
   * Setup handlers for polling mode
   */
  private setupPollingHandlers() {
    if (!this.bot) return

    this.bot.on('message', async (message: TelegramBot.Message) => {
      await this.handleMessage(message)
    })

    this.logger.log('Telegram polling handlers setup complete')
  }

  private async setupWebhook() {
    try {
      const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL')
      if (webhookUrl && this.bot) {
        await this.bot.setWebHook(webhookUrl)
        this.logger.log(`Telegram webhook set to: ${webhookUrl}`)
      }
    } catch (error) {
      this.logger.error('Failed to set Telegram webhook', error)
    }
  }

  /**
   * Handle incoming webhook updates from Telegram
   */
  async handleWebhook(update: TelegramBot.Update): Promise<void> {
    if (!this.bot || !this.botEnabled) return

    try {
      if (update.message) {
        await this.handleMessage(update.message)
      }
    } catch (error) {
      this.logger.error('Error handling webhook', error)
    }
  }

  /**
   * Handle incoming messages from users
   */
  private async handleMessage(message: TelegramBot.Message): Promise<void> {
    if (!this.bot) return

    const chatId = message.chat.id
    const text = message.text

    // Register or update telegram user
    await this.registerTelegramUser(message.from!)

    // Handle /start command
    if (text === '/start') {
      await this.bot.sendMessage(
        chatId,
        'Вітаємо у FullMag! 🛍️\n\n' +
          'Щоб отримувати персональні знижки та сповіщення, прив\'яжіть свій акаунт за допомогою команди:\n' +
          '/link YOUR_EMAIL\n\n' +
          'Наприклад: /link user@example.com',
      )
      return
    }

    // Handle /link command
    if (text?.startsWith('/link ')) {
      const email = text.replace('/link ', '').trim()
      await this.linkUserAccount(chatId, email)
      return
    }

    // Handle /unlink command
    if (text === '/unlink') {
      await this.unlinkUserAccount(chatId)
      return
    }

    // Handle /status command
    if (text === '/status') {
      await this.sendStatus(chatId)
      return
    }

    // Handle /cart command - view cart
    if (text === '/cart') {
      await this.sendCart(chatId)
      return
    }

    // Handle /promotions command - view active promotions
    if (text === '/promotions' || text === '/promo') {
      await this.sendPromotions(chatId)
      return
    }

    // Handle /orders command - view orders
    if (text === '/orders') {
      await this.sendOrders(chatId)
      return
    }

    // Handle /deals command - view discounted products
    if (text === '/deals') {
      await this.sendDeals(chatId)
      return
    }

    // Handle /help command
    if (text === '/help') {
      await this.sendHelp(chatId)
      return
    }

    // Simple hello response for testing
    this.logger.log(`Received message from ${chatId}: ${text}`)
    await this.sendHelp(chatId)
  }

  /**
   * Send help message with all available commands
   */
  private async sendHelp(chatId: number): Promise<void> {
    if (!this.bot) return

    await this.bot.sendMessage(
      chatId,
      '🛍️ *FullMag Bot* - Ваш помічник у покупках!\n\n' +
        '*Доступні команди:*\n\n' +
        '📋 *Основні:*\n' +
        '/start - Почати роботу з ботом\n' +
        '/help - Показати цю довідку\n' +
        '/status - Статус вашого акаунту\n\n' +
        '🔗 *Акаунт:*\n' +
        '/link EMAIL - Прив\'язати акаунт\n' +
        '/unlink - Від\'єднати акаунт\n\n' +
        '🛒 *Покупки:*\n' +
        '/cart - Переглянути кошик\n' +
        '/orders - Мої замовлення\n\n' +
        '🏷️ *Акції:*\n' +
        '/promotions - Активні промокоди\n' +
        '/deals - Товари зі знижками',
      { parse_mode: 'Markdown' }
    )
  }

  /**
   * Register or update a Telegram user
   */
  private async registerTelegramUser(
    from: TelegramBot.User,
  ): Promise<TelegramUser> {
    let telegramUser = await this.telegramUserRepo.findOne({
      where: { chatId: from.id.toString() },
    })

    if (telegramUser) {
      // Update existing user
      telegramUser.username = from.username || null
      telegramUser.firstName = from.first_name || null
      telegramUser.lastName = from.last_name || null
      telegramUser.languageCode = from.language_code || null
      telegramUser.isActive = true
    } else {
      // Create new user
      telegramUser = this.telegramUserRepo.create({
        chatId: from.id.toString(),
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        languageCode: from.language_code || null,
        isActive: true,
      })
    }

    return await this.telegramUserRepo.save(telegramUser)
  }

  /**
   * Link a Telegram account to a user account
   */
  private async linkUserAccount(
    chatId: number,
    email: string,
  ): Promise<void> {
    if (!this.bot) return

    try {
      const user = await this.userRepo.findOne({ where: { email } })

      if (!user) {
        await this.bot.sendMessage(
          chatId,
          '❌ Користувача з таким email не знайдено.',
        )
        return
      }

      const telegramUser = await this.telegramUserRepo.findOne({
        where: { chatId: chatId.toString() },
      })

      if (!telegramUser) {
        await this.bot.sendMessage(
          chatId,
          '❌ Telegram акаунт не знайдено. Спочатку використайте /start',
        )
        return
      }

      telegramUser.userId = user.id
      await this.telegramUserRepo.save(telegramUser)

      await this.bot.sendMessage(
        chatId,
        `✅ Акаунт успішно прив'язано!\n\nEmail: ${email}\n\nТепер ви будете отримувати персональні знижки та сповіщення про замовлення.`,
      )
    } catch (error) {
      this.logger.error('Error linking user account', error)
      await this.bot.sendMessage(
        chatId,
        '❌ Помилка при прив\'язці акаунту. Спробуйте пізніше.',
      )
    }
  }

  /**
   * Unlink a Telegram account from a user account
   */
  private async unlinkUserAccount(chatId: number): Promise<void> {
    if (!this.bot) return

    try {
      const telegramUser = await this.telegramUserRepo.findOne({
        where: { chatId: chatId.toString() },
      })

      if (!telegramUser || !telegramUser.userId) {
        await this.bot.sendMessage(
          chatId,
          '❌ Ваш акаунт не прив\'язаний.',
        )
        return
      }

      telegramUser.userId = null
      await this.telegramUserRepo.save(telegramUser)

      await this.bot.sendMessage(
        chatId,
        '✅ Акаунт успішно від\'єднано.\n\nВи більше не будете отримувати персональні сповіщення.',
      )
    } catch (error) {
      this.logger.error('Error unlinking user account', error)
      await this.bot.sendMessage(
        chatId,
        '❌ Помилка при від\'єднанні акаунту. Спробуйте пізніше.',
      )
    }
  }

  /**
   * Send status information to user
   */
  private async sendStatus(chatId: number): Promise<void> {
    if (!this.bot) return

    try {
      const telegramUser = await this.telegramUserRepo.findOne({
        where: { chatId: chatId.toString() },
        relations: ['user'],
      })

      if (!telegramUser) {
        await this.bot.sendMessage(
          chatId,
          '❌ Telegram акаунт не знайдено. Використайте /start',
        )
        return
      }

      let statusMessage = '📊 Статус вашого акаунту:\n\n'
      statusMessage += `Telegram ID: ${chatId}\n`
      statusMessage += `Username: @${telegramUser.username || 'не вказано'}\n\n`

      if (telegramUser.user) {
        statusMessage += `✅ Акаунт прив'язаний\n`
        statusMessage += `Email: ${telegramUser.user.email}\n`
        statusMessage += `Роль: ${telegramUser.user.role}\n`
      } else {
        statusMessage += `❌ Акаунт не прив'язаний\n\n`
        statusMessage += `Використайте /link EMAIL щоб прив'язати акаунт`
      }

      await this.bot.sendMessage(chatId, statusMessage)
    } catch (error) {
      this.logger.error('Error sending status', error)
    }
  }

  /**
   * Send cart information to user
   */
  private async sendCart(chatId: number): Promise<void> {
    if (!this.bot) return

    try {
      const telegramUser = await this.telegramUserRepo.findOne({
        where: { chatId: chatId.toString() },
      })

      if (!telegramUser?.userId) {
        await this.bot.sendMessage(
          chatId,
          '❌ Спочатку прив\'яжіть акаунт командою /link EMAIL',
        )
        return
      }

      const cart = await this.cartRepo.findOne({
        where: { userId: telegramUser.userId },
        relations: ['items', 'items.product'],
      })

      if (!cart || !cart.items || cart.items.length === 0) {
        await this.bot.sendMessage(
          chatId,
          '🛒 Ваш кошик порожній\n\n' +
            'Перейдіть на сайт, щоб додати товари:\n' +
            `${this.configService.get('FRONTEND_URL', 'http://localhost:10002')}/catalog`,
        )
        return
      }

      let message = '🛒 *Ваш кошик:*\n\n'
      let total = 0

      for (const item of cart.items) {
        const itemTotal = item.price * item.quantity
        total += itemTotal
        message += `📦 *${item.product?.name || 'Товар'}*\n`
        message += `   Кількість: ${item.quantity} шт.\n`
        message += `   Ціна: ${formatPrice(item.price, 'UAH')}\n`
        message += `   Сума: ${formatPrice(itemTotal, 'UAH')}\n\n`
      }

      message += `━━━━━━━━━━━━━━━━━━\n`
      message += `💰 *Загальна сума: ${formatPrice(total, 'UAH')}*\n\n`
      message += `🔗 [Оформити замовлення](${this.configService.get('FRONTEND_URL', 'http://localhost:10002')}/checkout)`

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    } catch (error) {
      this.logger.error('Error sending cart', error)
      await this.bot.sendMessage(chatId, '❌ Помилка при завантаженні кошика')
    }
  }

  /**
   * Send active promotions to user
   */
  private async sendPromotions(chatId: number): Promise<void> {
    if (!this.bot) return

    try {
      const now = new Date()

      const coupons = await this.couponRepo.find({
        where: {
          status: CouponStatus.ACTIVE,
        },
        order: { endDate: 'ASC' },
        take: 10,
      })

      // Filter valid coupons
      const validCoupons = coupons.filter(c => c.isValid())

      if (validCoupons.length === 0) {
        await this.bot.sendMessage(
          chatId,
          '🏷️ Наразі немає активних промокодів\n\n' +
            'Слідкуйте за оновленнями!',
        )
        return
      }

      let message = '🏷️ *Активні промокоди:*\n\n'

      for (const coupon of validCoupons) {
        message += `🎫 *${coupon.code}*\n`

        if (coupon.description) {
          message += `   ${coupon.description}\n`
        }

        if (coupon.type === 'percentage') {
          message += `   💰 Знижка: ${coupon.value}%\n`
        } else if (coupon.type === 'fixed_amount') {
          message += `   💰 Знижка: ${formatPrice(coupon.value, 'UAH')}\n`
        } else if (coupon.type === 'free_shipping') {
          message += `   🚚 Безкоштовна доставка\n`
        }

        if (coupon.minOrderAmount) {
          message += `   📦 Мін. замовлення: ${formatPrice(coupon.minOrderAmount, 'UAH')}\n`
        }

        if (coupon.endDate) {
          const endDate = new Date(coupon.endDate)
          message += `   ⏰ Діє до: ${endDate.toLocaleDateString('uk-UA')}\n`
        }

        message += '\n'
      }

      message += `💡 Використайте промокод при оформленні замовлення на сайті`

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
      this.logger.error('Error sending promotions', error)
      await this.bot.sendMessage(chatId, '❌ Помилка при завантаженні акцій')
    }
  }

  /**
   * Send user orders
   */
  private async sendOrders(chatId: number): Promise<void> {
    if (!this.bot) return

    try {
      const telegramUser = await this.telegramUserRepo.findOne({
        where: { chatId: chatId.toString() },
      })

      if (!telegramUser?.userId) {
        await this.bot.sendMessage(
          chatId,
          '❌ Спочатку прив\'яжіть акаунт командою /link EMAIL',
        )
        return
      }

      const orders = await this.orderRepo.find({
        where: { userId: telegramUser.userId },
        relations: ['items'],
        order: { createdAt: 'DESC' },
        take: 5,
      })

      if (orders.length === 0) {
        await this.bot.sendMessage(
          chatId,
          '📦 У вас ще немає замовлень\n\n' +
            'Перейдіть на сайт, щоб зробити перше замовлення:\n' +
            `${this.configService.get('FRONTEND_URL', 'http://localhost:10002')}/catalog`,
        )
        return
      }

      const statusEmoji: Record<string, string> = {
        pending: '⏳',
        processing: '🔄',
        paid: '✅',
        shipped: '🚚',
        delivered: '📬',
        cancelled: '❌',
      }

      const statusNames: Record<string, string> = {
        pending: 'Очікує обробки',
        processing: 'В обробці',
        paid: 'Оплачено',
        shipped: 'Відправлено',
        delivered: 'Доставлено',
        cancelled: 'Скасовано',
      }

      let message = '📦 *Ваші останні замовлення:*\n\n'

      for (const order of orders) {
        const emoji = statusEmoji[order.status] || '📋'
        const statusName = statusNames[order.status] || order.status
        const date = new Date(order.createdAt).toLocaleDateString('uk-UA')

        message += `${emoji} *№${order.id.slice(0, 8)}*\n`
        message += `   Дата: ${date}\n`
        message += `   Статус: ${statusName}\n`
        message += `   Сума: ${formatPrice(order.totalAmount, 'UAH')}\n`
        message += `   Товарів: ${order.items?.length || 0} шт.\n\n`
      }

      message += `🔗 [Детальніше на сайті](${this.configService.get('FRONTEND_URL', 'http://localhost:10002')}/profile/orders)`

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    } catch (error) {
      this.logger.error('Error sending orders', error)
      await this.bot.sendMessage(chatId, '❌ Помилка при завантаженні замовлень')
    }
  }

  /**
   * Send discounted products (deals)
   */
  private async sendDeals(chatId: number): Promise<void> {
    if (!this.bot) return

    try {
      const now = new Date()

      // Find products with active discounts
      const products = await this.productRepo
        .createQueryBuilder('product')
        .where('product.discountActive = :active', { active: true })
        .andWhere('product.discountPercent IS NOT NULL')
        .andWhere('product.discountPercent > 0')
        .andWhere('(product.discountStartDate IS NULL OR product.discountStartDate <= :now)', { now })
        .andWhere('(product.discountEndDate IS NULL OR product.discountEndDate >= :now)', { now })
        .orderBy('product.discountPercent', 'DESC')
        .take(10)
        .getMany()

      if (products.length === 0) {
        await this.bot.sendMessage(
          chatId,
          '🏷️ Наразі немає товарів зі знижками\n\n' +
            'Слідкуйте за оновленнями!',
        )
        return
      }

      let message = '🔥 *Товари зі знижками:*\n\n'

      for (const product of products) {
        const discount = Math.round(Number(product.discountPercent))
        const originalPrice = Number(product.price)
        const finalPrice = product.finalPrice

        message += `🏷️ *${product.name}*\n`
        message += `   ~${formatPrice(originalPrice, 'UAH')}~ → *${formatPrice(finalPrice, 'UAH')}*\n`
        message += `   💥 Знижка: -${discount}%\n`

        if (product.discountEndDate) {
          const endDate = new Date(product.discountEndDate)
          message += `   ⏰ До: ${endDate.toLocaleDateString('uk-UA')}\n`
        }
        message += '\n'
      }

      message += `🔗 [Всі акції на сайті](${this.configService.get('FRONTEND_URL', 'http://localhost:10002')}/catalog?sale=true)`

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    } catch (error) {
      this.logger.error('Error sending deals', error)
      await this.bot.sendMessage(chatId, '❌ Помилка при завантаженні знижок')
    }
  }

  /**
   * Send a message to a specific user
   */
  async sendPersonalMessage(dto: PersonalMessageDto): Promise<boolean> {
    if (!this.bot || !this.botEnabled) {
      this.logger.warn('Telegram bot is disabled')
      return false
    }

    try {
      const telegramUser = await this.telegramUserRepo.findOne({
        where: { userId: dto.userId, isActive: true },
      })

      if (!telegramUser) {
        this.logger.warn(
          `No active Telegram account found for user ${dto.userId}`,
        )
        return false
      }

      await this.bot.sendMessage(Number(telegramUser.chatId), dto.message, {
        parse_mode: 'Markdown',
      })

      this.logger.log(`Message sent to user ${dto.userId}`)
      return true
    } catch (error) {
      this.logger.error('Error sending personal message', error)
      return false
    }
  }

  /**
   * Broadcast a message to multiple users or all users
   */
  async broadcastMessage(dto: BroadcastMessageDto): Promise<number> {
    if (!this.bot || !this.botEnabled) {
      this.logger.warn('Telegram bot is disabled')
      return 0
    }

    let telegramUsers: TelegramUser[] = []

    if (dto.sendToAll) {
      // Send to all active telegram users
      telegramUsers = await this.telegramUserRepo.find({
        where: { isActive: true },
      })
    } else if (dto.userIds && dto.userIds.length > 0) {
      // Send to specific users
      telegramUsers = await this.telegramUserRepo
        .createQueryBuilder('tu')
        .where('tu.userId IN (:...userIds)', { userIds: dto.userIds })
        .andWhere('tu.isActive = :isActive', { isActive: true })
        .getMany()
    } else {
      this.logger.warn('No recipients specified for broadcast')
      return 0
    }

    let sentCount = 0

    for (const telegramUser of telegramUsers) {
      try {
        await this.bot.sendMessage(Number(telegramUser.chatId), dto.message, {
          parse_mode: 'Markdown',
        })
        sentCount++
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        this.logger.error(
          `Failed to send message to chat ${telegramUser.chatId}`,
          error,
        )
      }
    }

    this.logger.log(`Broadcast message sent to ${sentCount} users`)
    return sentCount
  }

  /**
   * Get all Telegram users
   */
  async getAllTelegramUsers(): Promise<TelegramUser[]> {
    return await this.telegramUserRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Get Telegram user by user ID
   */
  async getTelegramUserByUserId(userId: string): Promise<TelegramUser | null> {
    return await this.telegramUserRepo.findOne({
      where: { userId },
      relations: ['user'],
    })
  }

  /**
   * Send a test message directly to a chat ID
   */
  async sendTestMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.bot || !this.botEnabled) {
      this.logger.warn('Telegram bot is disabled')
      return false
    }

    try {
      await this.bot.sendMessage(Number(chatId), message, {
        parse_mode: 'Markdown',
      })
      this.logger.log(`Test message sent to chat ${chatId}`)
      return true
    } catch (error) {
      this.logger.error(`Error sending test message to chat ${chatId}`, error)
      return false
    }
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    if (!this.bot || !this.botEnabled) {
      return { enabled: false, message: 'Telegram bot is disabled' }
    }

    try {
      const me = await this.bot.getMe()
      const webhookInfo = await this.bot.getWebHookInfo()

      return {
        enabled: true,
        bot: {
          id: me.id,
          username: me.username,
          firstName: me.first_name,
        },
        webhook: {
          url: webhookInfo.url,
          hasCustomCertificate: webhookInfo.has_custom_certificate,
          pendingUpdateCount: webhookInfo.pending_update_count,
        },
      }
    } catch (error) {
      this.logger.error('Error getting bot info', error)
      return { enabled: true, error: error.message }
    }
  }
}
