'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import { DeliveryForm, DeliveryFormData } from '@/components/delivery/DeliveryForm'

const PaymentMethodValues = {
  ONLINE: 'online',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const { cart, totalAmount, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('online')

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [_hasHydrated, isAuthenticated, router])

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Your cart is empty')
      return
    }

    if (!deliveryData) {
      setError('Please fill in delivery information')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create order with delivery and payment information
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryType: deliveryData.deliveryType,
        deliveryCity: deliveryData.cityName,
        deliveryWarehouse: deliveryData.warehouseDescription,
        recipientName: deliveryData.recipientName,
        recipientPhone: deliveryData.recipientPhone,
        paymentMethod: paymentMethod,
      }

      const orderResponse = await api.post('/orders', orderData)
      const order = orderResponse.data

      // Clear cart
      await clearCart()

      // If online payment, simulate payment success and redirect to success page
      // If cash on delivery, redirect directly to success page
      if (paymentMethod === PaymentMethodValues.ONLINE) {
        // Simulated online payment - order is already marked as PAID by backend
        router.push(`/checkout/success?orderId=${order.id}`)
      } else {
        // Cash on delivery - order is marked as PENDING
        router.push(`/checkout/success?orderId=${order.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Інформація про доставку</h2>
        <DeliveryForm
          onDataChange={setDeliveryData}
          initialName={user?.email?.split('@')[0] || ''}
          initialPhone={user?.phone || ''}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Спосіб оплати</h2>
        <div className="space-y-3">
          <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
            <input
              type="radio"
              name="paymentMethod"
              value={PaymentMethodValues.ONLINE}
              checked={paymentMethod === PaymentMethodValues.ONLINE}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-semibold text-gray-900">Онлайн оплата</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Оплата картою (симуляція). Замовлення буде автоматично оплачене
              </p>
            </div>
          </label>

          <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
            <input
              type="radio"
              name="paymentMethod"
              value={PaymentMethodValues.CASH_ON_DELIVERY}
              checked={paymentMethod === PaymentMethodValues.CASH_ON_DELIVERY}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-semibold text-gray-900">Готівкою при отриманні</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Оплата готівкою або картою при отриманні товару
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.product?.name}</p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                {formatPrice(item.price * item.quantity, 'UAH')}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(totalAmount, 'UAH')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(totalAmount, 'UAH')}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading || !deliveryData}
        className="w-full bg-primary-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Обробка...' : 'Оформити замовлення'}
      </button>

      {!deliveryData && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Заповніть інформацію про доставку для продовження
        </p>
      )}
    </div>
  )
}
