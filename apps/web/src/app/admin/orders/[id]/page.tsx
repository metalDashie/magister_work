'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAID', label: 'Paid', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    sku?: string
    images?: string[]
  }
}

interface Order {
  id: string
  userId: string
  status: string
  paymentMethod: string
  totalAmount: number
  deliveryType: string
  deliveryCity: string
  deliveryWarehouse: string
  deliveryAddress?: string
  recipientName: string
  recipientPhone: string
  items: OrderItem[]
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminOrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { user, isLoading: authLoading } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, authLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin && orderId) {
      fetchOrder()
    }
  }, [isAdmin, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/orders/${orderId}`)
      setOrder(response.data)
    } catch (err: any) {
      console.error('Failed to fetch order:', err)
      setError(err.response?.data?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    try {
      setUpdating(true)
      await api.patch(`/orders/${order.id}/status`, { status: newStatus })
      setOrder({ ...order, status: newStatus })
    } catch (err: any) {
      console.error('Failed to update order status:', err)
      alert('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusConfig = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0]
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6 h-48"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="w-16 h-16 mx-auto text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Order not found'}
          </h2>
          <Link
            href="/admin/orders"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(order.status)
  const isPickup = order.deliveryType === 'pickup'
  const isOnlinePayment = order.paymentMethod === 'ONLINE' || order.paymentMethod === 'online'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Created on {new Date(order.createdAt).toLocaleString('uk-UA')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={order.status}
            onChange={(e) => updateOrderStatus(e.target.value)}
            disabled={updating}
            className={`px-4 py-2 rounded-lg font-semibold border-2 ${statusConfig.color} ${
              updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Order Items ({order.items.length})
            </h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={item.product.images?.[0]}
                      alt={item.product.name}
                      className="w-full h-full"
                      contentType="product"
                      objectFit="cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/products/${item.product.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    {item.product.sku && (
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.price, 'UAH')} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity, 'UAH')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.totalAmount), 'UAH')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{isPickup ? 'Free (Pickup)' : 'Calculated separately'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">
                  {formatPrice(Number(order.totalAmount), 'UAH')}
                </span>
              </div>
            </div>
          </div>

          {/* Order Timeline / Activity Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Created</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString('uk-UA')}
                  </p>
                </div>
              </div>
              {order.status !== 'PENDING' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Status: {statusConfig.label}</p>
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(order.updatedAt).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <div className="space-y-3">
              {order.user && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{order.user.email}</p>
                  </div>
                  {(order.user.firstName || order.user.lastName) && (
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">
                        {order.user.firstName} {order.user.lastName}
                      </p>
                    </div>
                  )}
                  {order.user.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{order.user.phone}</p>
                    </div>
                  )}
                </>
              )}
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-sm text-gray-600">{order.userId}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium text-gray-900">
                  {isOnlinePayment ? 'Online Payment' : 'Cash on Delivery'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  order.status === 'PAID' || order.status === 'DELIVERED' || order.status === 'SHIPPED' || order.status === 'PROCESSING'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'PAID' || order.status === 'DELIVERED' || order.status === 'SHIPPED' || order.status === 'PROCESSING'
                    ? 'Paid'
                    : order.status === 'CANCELLED'
                    ? 'Cancelled'
                    : 'Pending'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatPrice(Number(order.totalAmount), 'UAH')}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Delivery</h2>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isPickup ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isPickup ? 'Pickup' : 'Nova Poshta'}
              </span>
            </div>
            <div className="space-y-3">
              {isPickup ? (
                <div>
                  <p className="text-sm text-gray-500">Pickup Point</p>
                  <p className="font-medium text-gray-900">{order.deliveryWarehouse}</p>
                  {order.deliveryAddress && (
                    <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium text-gray-900">{order.deliveryCity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Warehouse</p>
                    <p className="font-medium text-gray-900">{order.deliveryWarehouse}</p>
                  </div>
                </>
              )}
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500">Recipient</p>
                <p className="font-medium text-gray-900">{order.recipientName}</p>
                <p className="text-sm text-gray-600">{order.recipientPhone}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/orders/${order.id}/invoice`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Invoice
              </Link>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Order
              </button>
              {order.status === 'PENDING' && (
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
