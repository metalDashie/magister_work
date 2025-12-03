'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'

interface AbandonedCart {
  id: string
  user: {
    id: string
    email: string
    name: string
  }
  itemCount: number
  totalValue: number
  updatedAt: string
  remindersSent: number
  lastReminderAt: string | null
}

interface Stats {
  totalAbandoned: number
  abandonedToday: number
  remindersSent: {
    today: number
    week: number
    month: number
  }
}

export default function AbandonedCartsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [processingAll, setProcessingAll] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, isAdmin, router])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData()
    }
  }, [isAuthenticated, isAdmin, page])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cartsRes, statsRes] = await Promise.all([
        api.get(`/abandoned-carts?page=${page}&limit=20`),
        api.get('/abandoned-carts/stats'),
      ])
      setCarts(cartsRes.data.carts)
      setTotalPages(cartsRes.data.totalPages)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Failed to fetch abandoned carts:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReminder = async (cartId: string) => {
    try {
      setSendingReminder(cartId)
      await api.post(`/abandoned-carts/${cartId}/remind`)
      fetchData()
    } catch (error) {
      console.error('Failed to send reminder:', error)
    } finally {
      setSendingReminder(null)
    }
  }

  const processAllCarts = async () => {
    try {
      setProcessingAll(true)
      await api.post('/abandoned-carts/process')
      fetchData()
    } catch (error) {
      console.error('Failed to process carts:', error)
    } finally {
      setProcessingAll(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA')
  }

  const getTimeSinceAbandoned = (dateString: string) => {
    const now = new Date()
    const abandoned = new Date(dateString)
    const hours = Math.floor((now.getTime() - abandoned.getTime()) / (1000 * 60 * 60))

    if (hours < 1) return 'Less than 1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Abandoned Carts</h1>
        <button
          onClick={processAllCarts}
          disabled={processingAll}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {processingAll ? 'Processing...' : 'Process All Now'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Abandoned</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalAbandoned}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Abandoned Today</div>
            <div className="text-3xl font-bold text-orange-600">{stats.abandonedToday}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Reminders Sent (Today)</div>
            <div className="text-3xl font-bold text-blue-600">{stats.remindersSent.today}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Reminders Sent (Month)</div>
            <div className="text-3xl font-bold text-green-600">{stats.remindersSent.month}</div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Automatic Recovery</h3>
            <p className="text-sm text-blue-700 mt-1">
              The system automatically sends up to 3 reminder emails to users who abandon their carts.
              First reminder is sent after 1 hour, subsequent reminders include a discount code.
            </p>
          </div>
        </div>
      </div>

      {/* Abandoned Carts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cart Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abandoned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reminders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {carts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No abandoned carts found
                </td>
              </tr>
            ) : (
              carts.map((cart) => (
                <tr key={cart.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cart.user.name}</div>
                    <div className="text-sm text-gray-500">{cart.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cart.itemCount} items</div>
                    <div className="text-sm font-medium text-primary-600">
                      {formatPrice(cart.totalValue, 'UAH')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTimeSinceAbandoned(cart.updatedAt)}</div>
                    <div className="text-xs text-gray-500">{formatDate(cart.updatedAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cart.remindersSent >= 3
                          ? 'bg-gray-100 text-gray-800'
                          : cart.remindersSent > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cart.remindersSent}/3 sent
                      </span>
                    </div>
                    {cart.lastReminderAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last: {formatDate(cart.lastReminderAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => sendReminder(cart.id)}
                      disabled={sendingReminder === cart.id || cart.remindersSent >= 3}
                      className="text-primary-600 hover:text-primary-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {sendingReminder === cart.id ? 'Sending...' : 'Send Reminder'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
