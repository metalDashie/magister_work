import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import TelegramBot = require('node-telegram-bot-api')
import { TelegramUser } from '../../database/entities/telegram-user.entity'
import { User } from '../../database/entities/user.entity'

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

    // Simple hello response for testing
    this.logger.log(`Received message from ${chatId}: ${text}`)
    await this.bot.sendMessage(
      chatId,
      'Hello, I got your message! 👋\n\n' +
        'Доступні команди:\n' +
        '/start - Почати\n' +
        '/link EMAIL - Прив\'язати акаунт\n' +
        '/unlink - Від\'єднати акаунт\n' +
        '/status - Переглянути статус',
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
