import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import axios from 'axios'
import { WhatsAppUser } from '../../database/entities/whatsapp-user.entity'
import { User } from '../../database/entities/user.entity'
import {
  WhatsAppWebhookPayload,
  WhatsAppIncomingMessage,
  WhatsAppSendMessageDto,
  WhatsAppSendMessageResponse,
  WhatsAppWebhookVerifyQuery,
} from './dto/whatsapp-webhook.dto'

export interface WhatsAppBroadcastMessageDto {
  message: string
  userIds?: string[]
  sendToAll?: boolean
}

export interface WhatsAppPersonalMessageDto {
  userId: string
  message: string
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name)
  private readonly botEnabled: boolean
  private readonly accessToken: string
  private readonly phoneNumberId: string
  private readonly webhookVerifyToken: string
  private readonly apiVersion = 'v18.0'
  private readonly baseUrl = 'https://graph.facebook.com'

  constructor(
    @InjectRepository(WhatsAppUser)
    private whatsappUserRepo: Repository<WhatsAppUser>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || ''
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || ''
    this.webhookVerifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || ''
    this.botEnabled = this.configService.get<string>('WHATSAPP_BOT_ENABLED') === 'true'

    if (this.botEnabled) {
      if (!this.accessToken || !this.phoneNumberId) {
        this.logger.warn(
          'WhatsApp Cloud API credentials not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
        )
      } else {
        this.logger.log('WhatsApp Cloud API service initialized')
      }
    } else {
      this.logger.warn('WhatsApp bot is disabled. Set WHATSAPP_BOT_ENABLED=true to enable.')
    }
  }

  /**
   * Verify webhook subscription (GET request from Meta)
   * Meta sends this request when you register your webhook URL
   */
  verifyWebhook(query: WhatsAppWebhookVerifyQuery): string | null {
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    this.logger.log(`Webhook verification request: mode=${mode}, token=${token}`)

    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      this.logger.log('Webhook verified successfully')
      return challenge
    }

    this.logger.warn('Webhook verification failed')
    return null
  }

  /**
   * Handle incoming webhook from WhatsApp Cloud API
   * This is called when a user sends a message to your WhatsApp Business number
   */
  async handleWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    if (!this.botEnabled) {
      this.logger.warn('WhatsApp bot is disabled, ignoring webhook')
      return
    }

    try {
      // Process each entry in the webhook payload
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value

          // Handle incoming messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              await this.handleIncomingMessage(message, value.contacts?.[0])
            }
          }

          // Handle status updates (optional logging)
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              this.logger.log(
                `Message ${status.id} status: ${status.status} for ${status.recipient_id}`,
              )
            }
          }

          // Handle errors
          if (value.errors && value.errors.length > 0) {
            for (const error of value.errors) {
              this.logger.error(
                `WhatsApp API Error: ${error.code} - ${error.title}: ${error.message}`,
              )
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling webhook', error)
    }
  }

  /**
   * Handle incoming message from a user
   */
  private async handleIncomingMessage(
    message: WhatsAppIncomingMessage,
    contact?: { profile: { name: string }; wa_id: string },
  ): Promise<void> {
    const fromNumber = message.from
    const messageId = message.id
    const messageType = message.type
    const contactName = contact?.profile?.name || 'Unknown'

    this.logger.log(
      `Received ${messageType} message from ${fromNumber} (${contactName}): ID=${messageId}`,
    )

    // Register or update WhatsApp user
    await this.registerWhatsAppUser(fromNumber, fromNumber, contactName)

    // Handle text messages
    if (messageType === 'text' && message.text?.body) {
      const textBody = message.text.body
      this.logger.log(`Message content: ${textBody}`)

      // Send hello response
      await this.sendTextMessage(
        fromNumber,
        'Hello, I got your message! 👋',
        messageId, // Reply to the original message
      )
    } else {
      // For non-text messages, still acknowledge
      await this.sendTextMessage(
        fromNumber,
        `Hello! I received your ${messageType} message. 👋`,
        messageId,
      )
    }
  }

  /**
   * Send a text message using WhatsApp Cloud API
   */
  async sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string,
  ): Promise<WhatsAppSendMessageResponse | null> {
    if (!this.botEnabled || !this.accessToken || !this.phoneNumberId) {
      this.logger.warn('WhatsApp Cloud API not configured')
      return null
    }

    try {
      const payload: WhatsAppSendMessageDto = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }

      // Add context for reply if messageId is provided
      if (replyToMessageId) {
        payload.context = {
          message_id: replyToMessageId,
        }
      }

      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`

      const response = await axios.post<WhatsAppSendMessageResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      this.logger.log(`Message sent to ${to}, ID: ${response.data.messages[0].id}`)
      return response.data
    } catch (error: any) {
      this.logger.error(
        `Failed to send message to ${to}:`,
        error.response?.data || error.message,
      )
      return null
    }
  }

  /**
   * Register or update a WhatsApp user
   */
  private async registerWhatsAppUser(
    whatsappId: string,
    phoneNumber: string,
    pushName?: string,
  ): Promise<WhatsAppUser> {
    let whatsappUser = await this.whatsappUserRepo.findOne({
      where: { whatsappId },
    })

    if (whatsappUser) {
      whatsappUser.phoneNumber = phoneNumber
      whatsappUser.pushName = pushName || null
      whatsappUser.isActive = true
    } else {
      whatsappUser = this.whatsappUserRepo.create({
        whatsappId,
        phoneNumber,
        pushName: pushName || null,
        isActive: true,
      })
    }

    return await this.whatsappUserRepo.save(whatsappUser)
  }

  /**
   * Link a WhatsApp account to a user account
   */
  async linkUserAccount(
    whatsappId: string,
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepo.findOne({ where: { email } })

      if (!user) {
        return { success: false, message: 'User not found with this email' }
      }

      const whatsappUser = await this.whatsappUserRepo.findOne({
        where: { whatsappId },
      })

      if (!whatsappUser) {
        return { success: false, message: 'WhatsApp account not found' }
      }

      whatsappUser.userId = user.id
      await this.whatsappUserRepo.save(whatsappUser)

      return { success: true, message: 'Account linked successfully' }
    } catch (error) {
      this.logger.error('Error linking user account', error)
      return { success: false, message: 'Error linking account' }
    }
  }

  /**
   * Send a message to a specific user by userId
   */
  async sendPersonalMessage(dto: WhatsAppPersonalMessageDto): Promise<boolean> {
    try {
      const whatsappUser = await this.whatsappUserRepo.findOne({
        where: { userId: dto.userId, isActive: true },
      })

      if (!whatsappUser) {
        this.logger.warn(`No active WhatsApp account found for user ${dto.userId}`)
        return false
      }

      const result = await this.sendTextMessage(whatsappUser.phoneNumber, dto.message)
      return result !== null
    } catch (error) {
      this.logger.error('Error sending personal message', error)
      return false
    }
  }

  /**
   * Broadcast a message to multiple users or all users
   */
  async broadcastMessage(dto: WhatsAppBroadcastMessageDto): Promise<number> {
    let whatsappUsers: WhatsAppUser[] = []

    if (dto.sendToAll) {
      whatsappUsers = await this.whatsappUserRepo.find({
        where: { isActive: true },
      })
    } else if (dto.userIds && dto.userIds.length > 0) {
      whatsappUsers = await this.whatsappUserRepo
        .createQueryBuilder('wu')
        .where('wu.userId IN (:...userIds)', { userIds: dto.userIds })
        .andWhere('wu.isActive = :isActive', { isActive: true })
        .getMany()
    } else {
      this.logger.warn('No recipients specified for broadcast')
      return 0
    }

    let sentCount = 0

    for (const whatsappUser of whatsappUsers) {
      try {
        const result = await this.sendTextMessage(whatsappUser.phoneNumber, dto.message)
        if (result) {
          sentCount++
        }
        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        this.logger.error(`Failed to send message to ${whatsappUser.phoneNumber}`, error)
      }
    }

    this.logger.log(`Broadcast message sent to ${sentCount} users`)
    return sentCount
  }

  /**
   * Get all WhatsApp users
   */
  async getAllWhatsAppUsers(): Promise<WhatsAppUser[]> {
    return await this.whatsappUserRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Get WhatsApp user by user ID
   */
  async getWhatsAppUserByUserId(userId: string): Promise<WhatsAppUser | null> {
    return await this.whatsappUserRepo.findOne({
      where: { userId },
      relations: ['user'],
    })
  }

  /**
   * Get bot status info
   */
  getBotInfo(): any {
    const configured = !!(this.accessToken && this.phoneNumberId)
    return {
      enabled: this.botEnabled,
      configured,
      phoneNumberId: this.phoneNumberId ? `***${this.phoneNumberId.slice(-4)}` : null,
      webhookVerifyTokenSet: !!this.webhookVerifyToken,
      message: this.botEnabled
        ? configured
          ? 'WhatsApp Cloud API is configured and ready'
          : 'WhatsApp Cloud API credentials not configured'
        : 'WhatsApp bot is disabled',
    }
  }
}
