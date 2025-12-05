import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { TelegramService, BroadcastMessageDto, PersonalMessageDto } from './telegram.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Webhook endpoint for Telegram updates
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() update: any) {
    await this.telegramService.handleWebhook(update)
    return { ok: true }
  }

  /**
   * Broadcast message to users (Admin only)
   */
  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcast(@Body() dto: BroadcastMessageDto) {
    const sentCount = await this.telegramService.broadcastMessage(dto)
    return {
      success: true,
      sentCount,
      message: `Message sent to ${sentCount} users`,
    }
  }

  /**
   * Get all Telegram users (Admin only)
   */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getTelegramUsers() {
    const users = await this.telegramService.getAllTelegramUsers()
    return {
      total: users.length,
      users,
    }
  }

  /**
   * Get bot info (Admin only)
   */
  @Get('bot-info')
  @UseGuards(JwtAuthGuard)
  async getBotInfo() {
    return await this.telegramService.getBotInfo()
  }

  /**
   * Send a test message to a specific user (Admin only)
   */
  @Post('send-message')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() dto: PersonalMessageDto) {
    const success = await this.telegramService.sendPersonalMessage(dto)
    return {
      success,
      message: success
        ? `Message sent successfully to user ${dto.userId}`
        : `Failed to send message. User may not have Telegram linked.`,
    }
  }

  /**
   * Send a test message by chat ID (for testing purposes)
   */
  @Post('send-test')
  @UseGuards(JwtAuthGuard)
  async sendTestMessage(@Body() dto: { chatId: string; message: string }) {
    const success = await this.telegramService.sendTestMessage(dto.chatId, dto.message)
    return {
      success,
      message: success
        ? `Test message sent to chat ${dto.chatId}`
        : `Failed to send test message`,
    }
  }
}
