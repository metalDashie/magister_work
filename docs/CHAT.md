# Live Chat Support System

## Overview

The FullMag e-commerce system includes a comprehensive real-time chat support feature that allows customers to communicate with support agents instantly. The system uses WebSocket technology (Socket.io) for real-time bidirectional communication.

## Features

### Customer Features
- **Floating Chat Widget**: Always accessible chat button on all pages
- **Real-time Messaging**: Instant message delivery
- **Unread Message Counter**: Visual indicator for new messages
- **Typing Indicators**: See when support agent is typing
- **Chat History**: Persistent conversation history
- **Auto-Reconnect**: Automatic reconnection on network interruptions

### Support Agent Features
- **Support Dashboard**: Centralized interface for managing customer chats
- **Multiple Chat Management**: Handle multiple customer conversations
- **Real-time Notifications**: Alert when new chat requests arrive
- **Chat Assignment**: Automatic assignment to available agents
- **Status Indicators**: See chat status (waiting, open, closed)
- **Message History**: View full conversation history

## Architecture

### Backend Components

#### 1. Database Entities

**ChatRoom Entity** (`chat_rooms` table):
```typescript
{
  id: UUID
  userId: UUID (customer)
  supportAgentId: UUID (support agent, nullable)
  status: enum ('waiting', 'open', 'closed')
  lastMessage: text
  unreadCount: integer
  createdAt: timestamp
  updatedAt: timestamp
}
```

**ChatMessage Entity** (`chat_messages` table):
```typescript
{
  id: UUID
  chatRoomId: UUID
  senderId: UUID
  message: text
  isRead: boolean
  isFromSupport: boolean
  createdAt: timestamp
}
```

#### 2. WebSocket Gateway

**Location**: `services/api/src/gateways/chat.gateway.ts`

**WebSocket Events**:

**Client → Server:**
- `register`: Register user socket connection
  ```typescript
  { userId: string }
  ```

- `joinRoom`: Join a specific chat room
  ```typescript
  { roomId: string }
  ```

- `sendMessage`: Send a message
  ```typescript
  {
    roomId: string
    senderId: string
    message: string
    isFromSupport?: boolean
  }
  ```

- `typing`: Typing indicator
  ```typescript
  {
    roomId: string
    userId: string
    isTyping: boolean
  }
  ```

**Server → Client:**
- `newMessage`: Receive new message
  ```typescript
  {
    id: string
    message: string
    senderId: string
    isFromSupport: boolean
    createdAt: string
  }
  ```

- `userTyping`: User typing indicator
  ```typescript
  {
    userId: string
    isTyping: boolean
  }
  ```

- `supportJoined`: Support agent joined chat
  ```typescript
  {
    agentName: string
    message: string
  }
  ```

- `newChatRequest`: New chat request (support agents only)
  ```typescript
  {
    roomId: string
    userName: string
    message: string
  }
  ```

#### 3. REST API Endpoints

**Chat Controller** (`/api/chat`):

- `GET /chat/room` - Get or create customer's chat room
- `GET /chat/room/:id` - Get specific chat room details
- `GET /chat/room/:id/messages` - Get chat messages
- `POST /chat/room/:id/read` - Mark messages as read
- `POST /chat/room/:id/close` - Close chat room
- `GET /chat/support/rooms` - Get all active chats (support agents only)
- `POST /chat/support/room/:id/assign` - Assign room to support agent

### Frontend Components

#### 1. Customer Chat Widget

**Location**: `apps/web/src/components/chat/ChatWidget.tsx`

**Features**:
- Floating button with unread counter
- Opens chat window on click
- Auto-initializes on user authentication

**Location**: `apps/web/src/components/chat/ChatWindow.tsx`

**Features**:
- Message list with sender identification
- Input field with send button
- Typing indicators
- Auto-scroll to latest message
- Status display (waiting, connected, offline)

#### 2. Support Dashboard

**Location**: `apps/web/src/app/admin/support/page.tsx`

**Features**:
- List of active chats
- Real-time message updates
- Chat assignment system
- Multi-chat interface
- Message sending
- Status indicators

#### 3. State Management

**Location**: `apps/web/src/lib/store/chatStore.ts`

**Zustand Store**:
```typescript
{
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
```

#### 4. Socket Service

**Location**: `apps/web/src/lib/socket/socket.ts`

**Singleton Service** for managing WebSocket connections:
- Connect/disconnect
- User registration
- Room management
- Message sending/receiving
- Event listeners

## Usage Guide

### For Customers

1. **Starting a Chat**:
   - Click the floating chat button (bottom-right corner)
   - Chat window opens automatically
   - Type your message and press Enter or click Send
   - Wait for support agent to respond

2. **Chat States**:
   - **Waiting**: Your chat is in queue for the next available agent
   - **Connected**: A support agent has joined your chat
   - **Offline**: No agents are currently available

3. **Notifications**:
   - Unread message count appears on chat button
   - Messages persist across page reloads

### For Support Agents

1. **Accessing Support Dashboard**:
   - Navigate to `/admin/support`
   - Only accessible to users with `admin` or `manager` roles

2. **Managing Chats**:
   - View all active chats in the left sidebar
   - Click on a chat to view messages
   - Chat automatically assigns to you when opened
   - Send responses using the input field at the bottom

3. **Chat Indicators**:
   - **Yellow badge**: Waiting for assignment
   - **Green badge**: Active conversation
   - **Gray badge**: Closed conversation
   - **Red counter**: Unread messages

4. **New Chat Notifications**:
   - New chats appear automatically in the list
   - Real-time updates when customers send messages

## Setup & Configuration

### 1. Install Dependencies

Already included in package.json:
```json
{
  "dependencies": {
    "socket.io": "^4.6.1",          // Backend
    "socket.io-client": "^4.6.1"    // Frontend
  }
}
```

### 2. Environment Variables

**Backend** (`services/api/.env`):
```env
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`apps/web/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Database Migration

The chat tables will be created automatically by TypeORM:
- `chat_rooms`
- `chat_messages`

### 4. Start the Application

```bash
# Start all services
docker-compose up -d

# Or manually
pnpm dev:api
pnpm dev:web
```

## Testing the Chat System

### Test as Customer

1. Register/login as a regular user
2. Navigate to any page
3. Click the chat button (bottom-right)
4. Send a test message
5. Chat status should show "Waiting for support..."

### Test as Support Agent

1. Register/login with admin role (or set role in database):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
2. Navigate to `/admin/support`
3. See the test chat appear in the list
4. Click on the chat and respond
5. Customer should receive the message instantly

## WebSocket Connection Flow

```
Customer Side:
1. User logs in
2. ChatWidget initializes
3. GET /api/chat/room (create/get room)
4. Socket connects to ws://localhost:3001/chat
5. Emit 'register' with userId
6. Emit 'joinRoom' with roomId
7. Listen for 'newMessage' events

Support Agent Side:
1. Admin logs in
2. Navigate to /admin/support
3. GET /api/chat/support/rooms (get all active chats)
4. Socket connects to ws://localhost:3001/chat
5. Emit 'register' with agentId
6. Listen for 'newChatRequest' events
7. Click on chat
8. Emit 'joinRoom' with roomId
9. POST /api/chat/support/room/:id/assign
10. Listen for 'newMessage' events
```

## Security Considerations

### Authentication
- All API endpoints require JWT authentication
- Socket connections validate user tokens
- Only authenticated users can send messages

### Authorization
- Support dashboard accessible only to admin/manager roles
- Users can only access their own chat rooms
- Support agents can access all active chats

### Data Validation
- Message content is sanitized
- Maximum message length enforced
- Rate limiting on message sending (future enhancement)

## Performance Optimization

### Backend
- Socket.io with Redis adapter for horizontal scaling (future)
- Message pagination for large conversations (future)
- Database indexing on chatRoomId and userId
- Connection pooling for database

### Frontend
- Lazy loading of chat history
- Optimistic UI updates
- Debounced typing indicators
- Message caching in Zustand store

## Troubleshooting

### Chat Button Not Appearing
- Check if user is authenticated
- Verify Socket.io dependencies installed
- Check browser console for errors

### Messages Not Sending
- Verify WebSocket connection (check Network tab)
- Ensure API server is running
- Check CORS configuration

### Support Dashboard Not Loading
- Verify user has admin/manager role
- Check API endpoint permissions
- Ensure chat rooms exist

### Connection Issues
- Check firewall settings
- Verify WebSocket ports are open
- Test with different transport methods

## Future Enhancements

### Planned Features
- [ ] File/image sharing in chat
- [ ] Chat transcripts via email
- [ ] Canned responses for support agents
- [ ] Chat ratings and feedback
- [ ] Offline message support
- [ ] Desktop notifications
- [ ] Mobile app integration
- [ ] Chat analytics dashboard
- [ ] Multi-language support
- [ ] Chat bots for common questions
- [ ] Video/audio call support

### Scalability
- [ ] Redis adapter for Socket.io (multi-server support)
- [ ] Message queue for async processing
- [ ] Chat archiving system
- [ ] Load balancing for WebSocket connections

## API Examples

### Get or Create Chat Room

```bash
curl -X GET http://localhost:3001/api/chat/room \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Message (via WebSocket)

```javascript
socket.emit('sendMessage', {
  roomId: 'room-uuid',
  senderId: 'user-uuid',
  message: 'Hello, I need help!'
})
```

### Get Chat Messages

```bash
curl -X GET http://localhost:3001/api/chat/room/ROOM_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Support Rooms (Admin)

```bash
curl -X GET http://localhost:3001/api/chat/support/rooms \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Monitoring

### Metrics to Track
- Active connections
- Average response time
- Messages per chat
- Support agent workload
- Customer satisfaction
- Peak usage times

### Logging
- Connection/disconnection events
- Error handling
- Message delivery status
- Support agent actions

---

**Live Chat System** - Enhancing customer support with real-time communication

For questions or issues, check the main README.md or create an issue in the repository.
