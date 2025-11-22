import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  Headers,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { WhatsAppService, WhatsAppBroadcastMessageDto } from './whatsapp.service'
import { WhatsAppWebhookPayload, WhatsAppWebhookVerifyQuery } from './dto/whatsapp-webhook.dto'

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Webhook verification endpoint (GET)
   * Meta sends this request when you register your webhook URL
   */
  @Get('webhook')
  verifyWebhook(
    @Query() query: WhatsAppWebhookVerifyQuery,
    @Res() res: Response,
  ) {
    const challenge = this.whatsappService.verifyWebhook(query)

    if (challenge) {
      return res.status(HttpStatus.OK).send(challenge)
    }

    return res.status(HttpStatus.FORBIDDEN).send('Verification failed')
  }

  /**
   * Webhook endpoint for incoming messages (POST)
   * Meta sends messages to this endpoint
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    // Acknowledge immediately, process asynchronously
    this.whatsappService.handleWebhook(payload).catch((error) => {
      console.error('Error processing webhook:', error)
    })

    return { status: 'ok' }
  }

  /**
   * Get bot status
   */
  @Get('status')
  getStatus() {
    return this.whatsappService.getBotInfo()
  }

  /**
   * Send a message (requires API key)
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() body: { to: string; message: string },
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey)

    const result = await this.whatsappService.sendTextMessage(body.to, body.message)
    return {
      success: result !== null,
      messageId: result?.messages[0]?.id,
    }
  }

  /**
   * Broadcast message to multiple users (requires API key)
   */
  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(
    @Body() dto: WhatsAppBroadcastMessageDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey)

    const sentCount = await this.whatsappService.broadcastMessage(dto)
    return {
      success: true,
      sentCount,
      message: `Message sent to ${sentCount} users`,
    }
  }

  /**
   * Validate API key for protected endpoints
   */
  private validateApiKey(apiKey: string): void {
    const validApiKey = this.configService.get<string>('SERVICE_API_KEY')

    if (!validApiKey) {
      throw new UnauthorizedException('Service API key not configured')
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key')
    }
  }
}
