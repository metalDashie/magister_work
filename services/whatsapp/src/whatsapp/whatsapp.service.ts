import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import {
  WhatsAppWebhookPayload,
  WhatsAppIncomingMessage,
  WhatsAppSendMessageDto,
  WhatsAppSendMessageResponse,
  WhatsAppWebhookVerifyQuery,
} from './dto/whatsapp-webhook.dto'

export interface WhatsAppBroadcastMessageDto {
  message: string
  phoneNumbers?: string[]
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
  private readonly mainApiUrl: string

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || ''
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || ''
    this.webhookVerifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || ''
    this.botEnabled = this.configService.get<string>('WHATSAPP_BOT_ENABLED') === 'true'
    this.mainApiUrl = this.configService.get<string>('MAIN_API_URL') || 'http://localhost:10001'

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
   */
  async handleWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    if (!this.botEnabled) {
      this.logger.warn('WhatsApp bot is disabled, ignoring webhook')
      return
    }

    try {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value

          // Handle incoming messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              await this.handleIncomingMessage(message, value.contacts?.[0])
            }
          }

          // Handle status updates
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

    // Notify main API about the message (optional - for logging/tracking)
    await this.notifyMainApi('message_received', {
      from: fromNumber,
      name: contactName,
      type: messageType,
      content: message.text?.body || `[${messageType}]`,
      timestamp: message.timestamp,
    })

    // Handle text messages
    if (messageType === 'text' && message.text?.body) {
      const textBody = message.text.body.toLowerCase()
      this.logger.log(`Message content: ${textBody}`)

      // Command handling
      if (textBody === '/start' || textBody === 'привіт' || textBody === 'hello') {
        await this.sendTextMessage(
          fromNumber,
          `Привіт, ${contactName}! 👋\n\nЯ бот магазину FullMag. Чим можу допомогти?\n\n` +
          `Команди:\n` +
          `/catalog - переглянути каталог\n` +
          `/orders - мої замовлення\n` +
          `/help - допомога`,
          messageId,
        )
      } else if (textBody === '/help' || textBody === 'допомога') {
        await this.sendTextMessage(
          fromNumber,
          `📚 Допомога\n\n` +
          `Доступні команди:\n` +
          `/catalog - переглянути каталог товарів\n` +
          `/orders - переглянути ваші замовлення\n` +
          `/help - показати цю довідку\n\n` +
          `Або просто напишіть своє питання, і ми відповімо!`,
          messageId,
        )
      } else if (textBody === '/catalog' || textBody === 'каталог') {
        await this.sendTextMessage(
          fromNumber,
          `🛍️ Наш каталог доступний на сайті:\n${this.configService.get('STORE_URL') || 'https://fullmag.com'}\n\n` +
          `Там ви можете переглянути всі товари та оформити замовлення.`,
          messageId,
        )
      } else if (textBody === '/orders' || textBody === 'замовлення') {
        await this.sendTextMessage(
          fromNumber,
          `📦 Щоб переглянути ваші замовлення, будь ласка, увійдіть на сайт:\n` +
          `${this.configService.get('STORE_URL') || 'https://fullmag.com'}/profile/orders`,
          messageId,
        )
      } else {
        // Default response for unrecognized messages
        await this.sendTextMessage(
          fromNumber,
          `Дякую за повідомлення! 📨\n\n` +
          `Наш менеджер відповість вам найближчим часом.\n\n` +
          `Для швидкої допомоги використовуйте команду /help`,
          messageId,
        )
      }
    } else {
      // For non-text messages
      await this.sendTextMessage(
        fromNumber,
        `Дякую! Я отримав ваше ${messageType === 'image' ? 'зображення' : messageType === 'document' ? 'документ' : 'повідомлення'}. 👍\n\n` +
        `Наш менеджер перегляне його та відповість вам.`,
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
   * Broadcast a message to multiple phone numbers
   */
  async broadcastMessage(dto: WhatsAppBroadcastMessageDto): Promise<number> {
    if (!dto.phoneNumbers || dto.phoneNumbers.length === 0) {
      this.logger.warn('No recipients specified for broadcast')
      return 0
    }

    let sentCount = 0

    for (const phoneNumber of dto.phoneNumbers) {
      try {
        const result = await this.sendTextMessage(phoneNumber, dto.message)
        if (result) {
          sentCount++
        }
        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        this.logger.error(`Failed to send message to ${phoneNumber}`, error)
      }
    }

    this.logger.log(`Broadcast message sent to ${sentCount} users`)
    return sentCount
  }

  /**
   * Notify main API about events (for logging/analytics)
   */
  private async notifyMainApi(event: string, data: any): Promise<void> {
    try {
      await axios.post(
        `${this.mainApiUrl}/webhooks/whatsapp-event`,
        { event, data },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Key': this.configService.get('SERVICE_API_KEY') || '',
          },
          timeout: 5000,
        },
      )
    } catch (error) {
      // Don't fail if main API is unavailable
      this.logger.warn('Failed to notify main API:', error)
    }
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
