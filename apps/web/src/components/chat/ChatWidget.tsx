'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useChatStore } from '@/lib/store/chatStore'
import ChatWindow from './ChatWindow'

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore()
  const { isOpen, openChat, unreadCount, initialize } = useChatStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user && !isInitialized) {
      initialize(user.id)
      setIsInitialized(true)
    }
  }, [isAuthenticated, user, isInitialized, initialize])

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-all z-50 flex items-center justify-center"
        >
          <svg
            className="w-6 h-6"
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
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && <ChatWindow />}
    </>
  )
}
