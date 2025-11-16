import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatRoom, ChatMessage } from '../../database/entities'
import { ChatRoomStatus } from '../../database/entities/chat-room.entity'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>
  ) {}

  async findOrCreateChatRoom(userId: string): Promise<ChatRoom> {
    let chatRoom = await this.chatRoomRepository.findOne({
      where: { userId, status: ChatRoomStatus.OPEN },
      relations: ['user', 'supportAgent'],
    })

    if (!chatRoom) {
      // Check for waiting room
      chatRoom = await this.chatRoomRepository.findOne({
        where: { userId, status: ChatRoomStatus.WAITING },
        relations: ['user', 'supportAgent'],
      })
    }

    if (!chatRoom) {
      chatRoom = this.chatRoomRepository.create({
        userId,
        status: ChatRoomStatus.WAITING,
      })
      chatRoom = await this.chatRoomRepository.save(chatRoom)
    }

    return chatRoom
  }

  async getChatRoom(roomId: string): Promise<ChatRoom | null> {
    return this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['user', 'supportAgent', 'messages', 'messages.sender'],
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    })
  }

  async getMessages(roomId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { chatRoomId: roomId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    })
  }

  async createMessage(
    roomId: string,
    senderId: string,
    message: string,
    isFromSupport: boolean = false
  ): Promise<ChatMessage | null> {
    const chatMessage = this.chatMessageRepository.create({
      chatRoomId: roomId,
      senderId,
      message,
      isFromSupport,
    })

    const savedMessage = await this.chatMessageRepository.save(chatMessage)

    // Update chat room last message and unread count
    await this.chatRoomRepository.update(roomId, {
      lastMessage: message,
      unreadCount: () => 'unread_count + 1',
    })

    // Load sender relation
    return this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    })
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    await this.chatMessageRepository.update(
      {
        chatRoomId: roomId,
        isRead: false,
        isFromSupport: true,
      },
      { isRead: true }
    )

    await this.chatRoomRepository.update(roomId, {
      unreadCount: 0,
    })
  }

  async assignSupportAgent(roomId: string, agentId: string): Promise<ChatRoom> {
    await this.chatRoomRepository.update(roomId, {
      supportAgentId: agentId,
      status: ChatRoomStatus.OPEN,
    })
    const chatRoom = await this.getChatRoom(roomId)
    if (!chatRoom) {
      throw new Error('Chat room not found')
    }
    return chatRoom
  }

  async closeChatRoom(roomId: string): Promise<void> {
    await this.chatRoomRepository.update(roomId, {
      status: ChatRoomStatus.CLOSED,
    })
  }

  async getOpenChatsForSupport(): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find({
      where: [
        { status: ChatRoomStatus.OPEN },
        { status: ChatRoomStatus.WAITING },
      ],
      relations: ['user', 'supportAgent'],
      order: { updatedAt: 'DESC' },
    })
  }

  async getSupportAgentChats(agentId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find({
      where: { supportAgentId: agentId },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    })
  }
}
