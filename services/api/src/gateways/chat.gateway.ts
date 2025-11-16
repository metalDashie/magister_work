import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from '../modules/chat/chat.service'

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private userSockets: Map<string, string> = new Map() // userId -> socketId

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
    // Remove from userSockets
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId)
        break
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ) {
    this.userSockets.set(data.userId, client.id)
    client.join(`user:${data.userId}`)
    console.log(`User ${data.userId} registered with socket ${client.id}`)
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    client.join(`room:${data.roomId}`)
    console.log(`Socket ${client.id} joined room ${data.roomId}`)
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    client.leave(`room:${data.roomId}`)
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string
      senderId: string
      message: string
      isFromSupport?: boolean
    }
  ) {
    try {
      const savedMessage = await this.chatService.createMessage(
        data.roomId,
        data.senderId,
        data.message,
        data.isFromSupport || false
      )

      // Emit to all clients in the room
      this.server.to(`room:${data.roomId}`).emit('newMessage', {
        ...savedMessage,
        chatRoomId: data.roomId,
      })

      return { success: true, message: savedMessage }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; isTyping: boolean }
  ) {
    client.to(`room:${data.roomId}`).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping,
    })
  }

  // Notify user when support agent joins
  notifySupportJoined(roomId: string, agentName: string) {
    this.server.to(`room:${roomId}`).emit('supportJoined', {
      agentName,
      message: `${agentName} has joined the chat`,
    })
  }

  // Notify support agents about new chat
  notifyNewChat(roomId: string, userName: string) {
    this.server.emit('newChatRequest', {
      roomId,
      userName,
      message: `New chat request from ${userName}`,
    })
  }
}
