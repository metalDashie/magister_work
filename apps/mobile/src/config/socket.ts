import { io, Socket } from 'socket.io-client'

const SOCKET_URL = __DEV__
  ? 'http://10.0.2.2:3001' // Android emulator, no /api for socket
  : 'https://api.fullmag.com' // Production

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (!this.socket) {
      this.socket = io(`${SOCKET_URL}/chat`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
      })

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect()
    }
    return this.socket
  }

  registerUser(userId: string) {
    const socket = this.getSocket()
    socket.emit('register', { userId })
  }

  joinRoom(roomId: string) {
    const socket = this.getSocket()
    socket.emit('joinRoom', { roomId })
  }

  leaveRoom(roomId: string) {
    const socket = this.getSocket()
    socket.emit('leaveRoom', { roomId })
  }

  sendMessage(roomId: string, senderId: string, message: string) {
    const socket = this.getSocket()
    socket.emit('sendMessage', { roomId, senderId, message })
  }

  onNewMessage(callback: (message: any) => void) {
    const socket = this.getSocket()
    socket.on('newMessage', callback)
  }

  offNewMessage() {
    const socket = this.getSocket()
    socket.off('newMessage')
  }

  sendTyping(roomId: string, userId: string, isTyping: boolean) {
    const socket = this.getSocket()
    socket.emit('typing', { roomId, userId, isTyping })
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    const socket = this.getSocket()
    socket.on('userTyping', callback)
  }

  onSupportJoined(callback: (data: { agentName: string; message: string }) => void) {
    const socket = this.getSocket()
    socket.on('supportJoined', callback)
  }
}

export const socketService = new SocketService()
