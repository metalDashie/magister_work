'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'

enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images?: string[]
    sku?: string
  }
}

interface Order {
  id: string
  status: OrderStatus
  paymentMethod: string
  totalAmount: number
  deliveryType: string
  deliveryCity: string
  deliveryWarehouse: string
  deliveryAddress?: string
  recipientName: string
  recipientPhone: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  [OrderStatus.PENDING]: {
    label: 'Очікує обробки',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  [OrderStatus.PROCESSING]: {
    label: 'Обробляється',
    color: 'bg-blue-100 text-blue-800',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  [OrderStatus.PAID]: {
    label: 'Оплачено',
    color: 'bg-green-100 text-green-800',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  [OrderStatus.SHIPPED]: {
    label: 'Відправлено',
    color: 'bg-purple-100 text-purple-800',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  },
  [OrderStatus.DELIVERED]: {
    label: 'Доставлено',
    color: 'bg-green-100 text-green-800',
    icon: 'M5 13l4 4L19 7',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Скасовано',
    color: 'bg-red-100 text-red-800',
    icon: 'M6 18L18 6M6 6l12 12',
  },
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/orders/${orderId}`)
        setOrder(response.data)
      } catch (err: any) {
        console.error('Failed to fetch order:', err)
        setError(err.response?.data?.message || 'Не вдалося завантажити замовлення')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [_hasHydrated, isAuthenticated, orderId, router])

  if (!_hasHydrated || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {error || 'Замовлення не знайдено'}
          </h2>
          <Link
            href="/profile/orders"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Повернутися до списку замовлень
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status] || statusConfig[OrderStatus.PENDING]
  const isOnlinePayment = order.paymentMethod === 'online'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/profile/orders"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад до замовлень
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Замовлення #{order.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Order Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Статус замовлення</h2>
        <div className="flex items-center justify-between">
          {[OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED].map((s, index) => {
            const stepStatus = statusConfig[s]
            const isActive = order.status === s
            const isPassed = Object.values(OrderStatus).indexOf(order.status) >= Object.values(OrderStatus).indexOf(s)
            const isCancelled = order.status === OrderStatus.CANCELLED

            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCancelled
                        ? 'bg-gray-200 text-gray-400'
                        : isPassed
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stepStatus.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs mt-2 text-center ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                    {stepStatus.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      isCancelled
                        ? 'bg-gray-200'
                        : Object.values(OrderStatus).indexOf(order.status) > Object.values(OrderStatus).indexOf(s)
                        ? 'bg-primary-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
        {order.status === OrderStatus.CANCELLED && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            Це замовлення було скасовано.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Товари ({order.items.length})</h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                      href={`/products/${item.product.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    {item.product.sku && (
                      <p className="text-sm text-gray-500 mt-1">Артикул: {item.product.sku}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
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

            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Товари</span>
                <span>{formatPrice(order.totalAmount, 'UAH')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span>Безкоштовно</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Всього</span>
                <span className="text-primary-600">{formatPrice(order.totalAmount, 'UAH')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Інформація</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Дата замовлення</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Спосіб оплати</dt>
                <dd className="font-medium text-gray-900">
                  {isOnlinePayment ? 'Онлайн оплата' : 'Готівкою при отриманні'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Номер замовлення</dt>
                <dd className="font-medium text-gray-900 font-mono">
                  {order.id.slice(0, 8).toUpperCase()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Доставка</h2>
              {order.deliveryType === 'pickup' ? (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Самовивіз
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Нова Пошта
                </span>
              )}
            </div>
            <div className="space-y-3">
              {order.deliveryType === 'pickup' ? (
                <>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Пункт самовивозу</p>
                      <p className="font-medium text-gray-900">{order.deliveryWarehouse}</p>
                      {order.deliveryAddress && (
                        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Місто</p>
                      <p className="font-medium text-gray-900">{order.deliveryCity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Відділення</p>
                      <p className="font-medium text-gray-900">{order.deliveryWarehouse}</p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Одержувач</p>
                  <p className="font-medium text-gray-900">{order.recipientName}</p>
                  <p className="text-sm text-gray-600">{order.recipientPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/orders/${order.id}/invoice`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Завантажити рахунок
            </Link>
            <Link
              href="/profile/orders"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Всі замовлення
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
