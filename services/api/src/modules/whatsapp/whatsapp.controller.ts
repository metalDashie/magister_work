import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { WhatsAppService, WhatsAppBroadcastMessageDto } from './whatsapp.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WhatsAppWebhookPayload, WhatsAppWebhookVerifyQuery } from './dto/whatsapp-webhook.dto'

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * Webhook verification endpoint (GET)
   * Meta sends this request when you register your webhook URL
   * Must return the challenge string to verify the webhook
   */
  @Get('webhook')
  verifyWebhook(
    @Query() query: WhatsAppWebhookVerifyQuery,
    @Res() res: Response,
  ) {
    const challenge = this.whatsappService.verifyWebhook(query)

    if (challenge) {
      // Must return the challenge as plain text
      return res.status(HttpStatus.OK).send(challenge)
    }

    return res.status(HttpStatus.FORBIDDEN).send('Verification failed')
  }

  /**
   * Webhook endpoint for incoming messages (POST)
   * Meta sends messages to this endpoint when users message your WhatsApp number
   * IMPORTANT: Must return 200 OK quickly to acknowledge receipt
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    // Acknowledge immediately, process asynchronously
    // This is important as WhatsApp expects a quick 200 response
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
   * Broadcast message to users (Admin only)
   */
  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcast(@Body() dto: WhatsAppBroadcastMessageDto) {
    const sentCount = await this.whatsappService.broadcastMessage(dto)
    return {
      success: true,
      sentCount,
      message: `Message sent to ${sentCount} users`,
    }
  }

  /**
   * Get all WhatsApp users (Admin only)
   */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getWhatsAppUsers() {
    const users = await this.whatsappService.getAllWhatsAppUsers()
    return {
      total: users.length,
      users,
    }
  }

  /**
   * Send a test message (Admin only)
   */
  @Post('send-test')
  @UseGuards(JwtAuthGuard)
  async sendTestMessage(@Body() body: { to: string; message: string }) {
    const result = await this.whatsappService.sendTextMessage(body.to, body.message)
    return {
      success: result !== null,
      messageId: result?.messages[0]?.id,
    }
  }
}
