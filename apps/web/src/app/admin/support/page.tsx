'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { socketService } from '@/lib/socket/socket'
import { formatDateTime } from '@fullmag/common'

interface ChatRoom {
  id: string
  userId: string
  supportAgentId?: string
  status: string
  lastMessage?: string
  unreadCount: number
  user: {
    id: string
    email: string
  }
  updatedAt: string
}

interface Message {
  id: string
  message: string
  senderId: string
  isFromSupport: boolean
  createdAt: string
  sender: {
    email: string
  }
}

export default function SupportPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Check if user has admin or manager role
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }

    loadChatRooms()
    initializeSocket()

    return () => {
      socketService.disconnect()
    }
  }, [_hasHydrated, isAuthenticated, user, router])

  const initializeSocket = () => {
    if (!user) return

    socketService.connect()
    socketService.registerUser(user.id)

    // Listen for new chat requests
    const socket = socketService.getSocket()
    socket.on('newChatRequest', (data: { roomId: string; userName: string }) => {
      console.log('New chat request:', data)
      loadChatRooms()
    })

    // Listen for new messages
    socketService.onNewMessage((message: Message) => {
      setMessages((prev) => [...prev, message])
      loadChatRooms() // Refresh room list
    })
  }

  const loadChatRooms = async () => {
    try {
      const response = await api.get('/chat/support/rooms')
      setChatRooms(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load chat rooms:', error)
      setLoading(false)
    }
  }

  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room)
    socketService.joinRoom(room.id)

    // Load messages
    try {
      const response = await api.get(`/chat/room/${room.id}/messages`)
      setMessages(response.data)

      // Assign to self if not assigned
      if (!room.supportAgentId && user) {
        await api.post(`/chat/support/room/${room.id}/assign`)
        loadChatRooms()
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedRoom || !user) return

    socketService.sendMessage(selectedRoom.id, user.id, inputMessage)
    setInputMessage('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800'
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Customer Support Dashboard</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Rooms List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Active Chats ({chatRooms.length})</h2>

            {chatRooms.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>No active chats</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedRoom?.id === room.id
                        ? 'bg-primary-100 border-2 border-primary-600'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{room.user.email}</p>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
                            room.status
                          )}`}
                        >
                          {room.status}
                        </span>
                      </div>
                      {room.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">{room.lastMessage}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(room.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-semibold text-lg">{selectedRoom.user.email}</h3>
                <p className="text-sm text-gray-600">Chat ID: {selectedRoom.id.slice(0, 8)}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => {
                  const isOwnMessage = message.isFromSupport

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {message.sender.email}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString('uk-UA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
