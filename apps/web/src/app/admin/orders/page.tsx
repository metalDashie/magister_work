'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface Order {
  id: string
  userId: string
  status: string
  paymentMethod: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  deliveryType?: string
  deliveryCity?: string
  deliveryWarehouse?: string
  deliveryAddress?: string
  recipientName?: string
  recipientPhone?: string
  user?: {
    email: string
    firstName?: string
    lastName?: string
  }
  items?: Array<{
    id: string
    productId: string
    quantity: number
    price: number
    product?: {
      name: string
      sku?: string
    }
  }>
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'PAID', label: 'Paid', color: 'blue' },
  { value: 'PROCESSING', label: 'Processing', color: 'purple' },
  { value: 'SHIPPED', label: 'Shipped', color: 'indigo' },
  { value: 'DELIVERED', label: 'Delivered', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
]

export default function AdminOrders() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchOrders()
    }
  }, [isAdmin])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders/admin/all')
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      // If endpoint doesn't exist, try fetching from analytics
      try {
        const response = await api.get('/analytics/recent-orders', {
          params: { limit: 1000 },
        })
        setOrders(response.data)
      } catch (err) {
        console.error('Failed to fetch from analytics:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      // Refresh orders
      fetchOrders()
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status')
    }
  }

  const filteredOrders = orders
    .filter((order) => {
      if (selectedStatus !== 'ALL' && order.status !== selectedStatus) {
        return false
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          order.id.toLowerCase().includes(search) ||
          order.user?.email?.toLowerCase().includes(search) ||
          order.recipientName?.toLowerCase().includes(search) ||
          order.recipientPhone?.includes(search)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else {
        const amountA = Number(a.totalAmount)
        const amountB = Number(b.totalAmount)
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA
      }
    })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status)
    return statusConfig?.color || 'gray'
  }

  const getStatusLabel = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status)
    return statusConfig?.label || status
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = getStatusLabel

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading orders...</div>
      </div>
    )
  }

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    paid: orders.filter((o) => o.status === 'PAID').length,
    processing: orders.filter((o) => o.status === 'PROCESSING').length,
    shipped: orders.filter((o) => o.status === 'SHIPPED').length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{orderStats.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-700">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">
            {orderStats.pending}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-sm text-blue-700">Paid</div>
          <div className="text-2xl font-bold text-blue-700">
            {orderStats.paid}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <div className="text-sm text-purple-700">Processing</div>
          <div className="text-2xl font-bold text-purple-700">
            {orderStats.processing}
          </div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg shadow">
          <div className="text-sm text-indigo-700">Shipped</div>
          <div className="text-2xl font-bold text-indigo-700">
            {orderStats.shipped}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-700">Delivered</div>
          <div className="text-2xl font-bold text-green-700">
            {orderStats.delivered}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-700">Cancelled</div>
          <div className="text-2xl font-bold text-red-700">
            {orderStats.cancelled}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Order ID, email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {order.id.substring(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.user?.email || 'Guest'}
                      </div>
                      {order.recipientName && (
                        <div className="text-sm text-gray-500">
                          {order.recipientName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value)
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold bg-${getStatusColor(
                          order.status,
                        )}-100 text-${getStatusColor(order.status)}-800 border-0`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'Cash on Delivery'
                          : 'Online Payment'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(order.totalAmount))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() =>
                          router.push(`/admin/orders/${order.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  )
}
