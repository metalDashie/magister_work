'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import Link from 'next/link'

enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

const PaymentMethodValues = {
  ONLINE: 'online',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const

interface Order {
  id: string
  totalAmount: number
  status: OrderStatus
  paymentMethod: string
  deliveryCity: string
  deliveryWarehouse: string
  recipientName: string
  recipientPhone: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
    }
  }>
  createdAt: string
}

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!orderId) {
      setError('Order ID not provided')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`)
        setOrder(response.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [_hasHydrated, isAuthenticated, orderId, router])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження інформації про замовлення...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Помилка</h2>
          <p className="text-gray-600 mb-6">{error || 'Не вдалося завантажити замовлення'}</p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            Повернутися до покупок
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.status === OrderStatus.PAID
  const isOnlinePayment = order.paymentMethod === PaymentMethodValues.ONLINE

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Замовлення оформлене!</h1>
        <p className="text-gray-600">
          Дякуємо за ваше замовлення. Ми відправили підтвердження на вашу електронну пошту.
        </p>
      </div>

      {/* Order Number and Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Номер замовлення</p>
            <p className="text-xl font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Статус</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                isPaid
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {isPaid ? 'Оплачено' : 'Очікує оплати'}
            </span>
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Дата замовлення</p>
            <p className="font-semibold text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Спосіб оплати</p>
            <p className="font-semibold text-gray-900">
              {isOnlinePayment ? 'Онлайн оплата' : 'Готівкою при отриманні'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Status Message */}
      {isOnlinePayment && isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-900">Оплата успішна</p>
              <p className="text-sm text-green-700 mt-1">
                Ваше замовлення оплачене онлайн. Ми почнемо обробку вашого замовлення найближчим часом.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isOnlinePayment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900">Оплата при отриманні</p>
              <p className="text-sm text-blue-700 mt-1">
                Оплатіть замовлення готівкою або карткою при отриманні у відділенні Нової Пошти.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Інформація про доставку</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm text-gray-600">Місто</p>
              <p className="font-semibold text-gray-900">{order.deliveryCity}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-sm text-gray-600">Відділення</p>
              <p className="font-semibold text-gray-900">{order.deliveryWarehouse}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="text-sm text-gray-600">Одержувач</p>
              <p className="font-semibold text-gray-900">{order.recipientName}</p>
              <p className="text-sm text-gray-600">{order.recipientPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Товари в замовленні</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
              <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                {item.product.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-600">
                  {formatPrice(item.price, 'UAH')} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-gray-900 flex-shrink-0">
                {formatPrice(item.price * item.quantity, 'UAH')}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Загальна сума</span>
            <span className="text-primary-600">{formatPrice(order.totalAmount, 'UAH')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href={`/profile/orders/${order.id}`}
          className="flex-1 bg-primary-600 text-white text-center py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors"
        >
          Переглянути деталі замовлення
        </Link>
        <Link
          href="/products"
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 text-center py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors"
        >
          Продовжити покупки
        </Link>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
