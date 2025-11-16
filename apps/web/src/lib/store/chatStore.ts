import { create } from 'zustand'
import { api } from '../api'
import { socketService } from '../socket/socket'

interface Message {
  id: string
  chatRoomId: string
  senderId: string
  message: string
  isFromSupport: boolean
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    email: string
  }
}

interface ChatRoom {
  id: string
  userId: string
  supportAgentId?: string
  status: 'open' | 'closed' | 'waiting'
  lastMessage?: string
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface ChatState {
  chatRoom: ChatRoom | null
  messages: Message[]
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  unreadCount: number
  loading: boolean
  initialize: (userId: string) => Promise<void>
  openChat: () => void
  closeChat: () => void
  sendMessage: (message: string, userId: string) => void
  loadMessages: () => Promise<void>
  markAsRead: () => Promise<void>
  disconnect: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatRoom: null,
  messages: [],
  isOpen: false,
  isConnected: false,
  isTyping: false,
  unreadCount: 0,
  loading: false,

  initialize: async (userId: string) => {
    try {
      // Get or create chat room
      const response = await api.get('/chat/room')
      const chatRoom = response.data

      set({ chatRoom, unreadCount: chatRoom.unreadCount })

      // Connect to socket
      socketService.connect()
      socketService.registerUser(userId)
      socketService.joinRoom(chatRoom.id)

      // Listen for new messages
      socketService.onNewMessage((message: Message) => {
        const currentMessages = get().messages
        const exists = currentMessages.find((m) => m.id === message.id)
        if (!exists) {
          set({ messages: [...currentMessages, message] })

          // Increment unread count if chat is closed
          if (!get().isOpen && !message.isFromSupport) {
            set({ unreadCount: get().unreadCount + 1 })
          }
        }
      })

      // Listen for typing indicator
      socketService.onUserTyping((data) => {
        set({ isTyping: data.isTyping })
      })

      // Listen for support agent joined
      socketService.onSupportJoined((data) => {
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          chatRoomId: chatRoom.id,
          senderId: 'system',
          message: data.message,
          isFromSupport: true,
          isRead: true,
          createdAt: new Date().toISOString(),
        }
        set({ messages: [...get().messages, systemMessage] })
      })

      set({ isConnected: true })

      // Load existing messages
      await get().loadMessages()
    } catch (error) {
      console.error('Failed to initialize chat:', error)
    }
  },

  openChat: () => {
    set({ isOpen: true, unreadCount: 0 })
    get().markAsRead()
  },

  closeChat: () => {
    set({ isOpen: false })
  },

  sendMessage: (message: string, userId: string) => {
    const { chatRoom } = get()
    if (!chatRoom) return

    socketService.sendMessage(chatRoom.id, userId, message)
  },

  loadMessages: async () => {
    const { chatRoom } = get()
    if (!chatRoom) return

    set({ loading: true })
    try {
      const response = await api.get(`/chat/room/${chatRoom.id}/messages`)
      set({ messages: response.data, loading: false })
    } catch (error) {
      console.error('Failed to load messages:', error)
      set({ loading: false })
    }
  },

  markAsRead: async () => {
    const { chatRoom } = get()
    if (!chatRoom) return

    try {
      await api.post(`/chat/room/${chatRoom.id}/read`)
      set({ unreadCount: 0 })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  },

  disconnect: () => {
    socketService.offNewMessage()
    socketService.disconnect()
    set({ isConnected: false, messages: [], chatRoom: null })
  },
}))
