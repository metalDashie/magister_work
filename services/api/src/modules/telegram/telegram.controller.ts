import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { TelegramService, BroadcastMessageDto } from './telegram.service'
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
}
