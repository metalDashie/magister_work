import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ChatService } from './chat.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('room')
  async getOrCreateRoom(@Request() req) {
    return this.chatService.findOrCreateChatRoom(req.user.userId)
  }

  @Get('room/:id')
  async getRoom(@Param('id') id: string) {
    return this.chatService.getChatRoom(id)
  }

  @Get('room/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id)
  }

  @Post('room/:id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    await this.chatService.markMessagesAsRead(id, req.user.userId)
    return { success: true }
  }

  @Post('room/:id/close')
  async closeRoom(@Param('id') id: string) {
    await this.chatService.closeChatRoom(id)
    return { success: true }
  }

  @Get('support/rooms')
  async getSupportRooms(@Request() req) {
    // Check if user is support agent (admin or manager)
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return this.chatService.getOpenChatsForSupport()
    }
    return []
  }

  @Post('support/room/:id/assign')
  async assignRoom(@Param('id') id: string, @Request() req) {
    return this.chatService.assignSupportAgent(id, req.user.userId)
  }
}
