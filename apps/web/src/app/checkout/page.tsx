'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import {
  DeliveryForm,
  DeliveryFormData,
} from '@/components/delivery/DeliveryForm'
import { CheckoutStripePayment } from '@/components/payment/CheckoutStripePayment'

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

  // For Stripe payment
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [showStripeForm, setShowStripeForm] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      console.log('[REDIRECT] checkout/page.tsx -> /auth/login', {
        _hasHydrated,
        isAuthenticated,
      })
      // router.push('/auth/login')
    }
  }, [_hasHydrated, isAuthenticated, router])

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const createOrder = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Your cart is empty')
    }

    if (!deliveryData) {
      throw new Error('Please fill in delivery information')
    }

    const orderData: Record<string, any> = {
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      deliveryType: deliveryData.deliveryType,
      recipientName: deliveryData.recipientName,
      recipientPhone: deliveryData.recipientPhone,
      paymentMethod: paymentMethod,
    }

    // Add delivery-specific fields
    if (deliveryData.deliveryType === 'nova_poshta_warehouse') {
      orderData.deliveryCity = deliveryData.cityName
      orderData.deliveryWarehouse = deliveryData.warehouseDescription
    } else if (deliveryData.deliveryType === 'pickup') {
      orderData.deliveryCity = 'Самовивіз'
      orderData.deliveryWarehouse = deliveryData.pickupPointName
      orderData.deliveryAddress = deliveryData.pickupPointAddress
    }

    const orderResponse = await api.post('/orders', orderData)
    return orderResponse.data
  }

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
      // For online payment, create order and show Stripe form
      if (paymentMethod === PaymentMethodValues.ONLINE) {
        const order = await createOrder()
        setPendingOrderId(order.id)
        setShowStripeForm(true)
        setLoading(false)
        return
      }

      // For cash on delivery, create order and redirect to success
      const order = await createOrder()
      await clearCart()
      router.push(`/checkout/success?orderId=${order.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Checkout failed')
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    await clearCart()
    router.push(`/checkout/success?orderId=${pendingOrderId}`)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handlePaymentCancel = () => {
    setShowStripeForm(false)
    setPendingOrderId(null)
    setError('')
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h2>
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

  // Show Stripe payment form after order is created
  if (showStripeForm && pendingOrderId) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handlePaymentCancel}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад до оформлення
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Оплата замовлення</h1>
        <p className="text-gray-600 mb-8">Замовлення #{pendingOrderId.slice(0, 8).toUpperCase()}</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ваше замовлення</h2>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-sm text-gray-600">Кількість: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  {formatPrice(item.price * item.quantity, 'UAH')}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-semibold text-lg">
            <span>До сплати</span>
            <span className="text-primary-600">{formatPrice(totalAmount, 'UAH')}</span>
          </div>
        </div>

        {/* Stripe Payment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Оплата карткою</h2>
          <CheckoutStripePayment
            orderId={pendingOrderId}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Ваші платіжні дані захищені SSL шифруванням
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Оформлення замовлення</h1>

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
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span className="font-semibold text-gray-900">
                  Оплата карткою
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Безпечна оплата через Stripe
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
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-semibold text-gray-900">
                  Готівкою при отриманні
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Оплата готівкою або картою при отриманні товару
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Товари</h2>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.product?.name}</p>
                <p className="text-sm text-gray-600">
                  Кількість: {item.quantity}
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
        <h2 className="text-xl font-semibold mb-4">Підсумок замовлення</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Товари</span>
            <span>{formatPrice(totalAmount, 'UAH')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Доставка</span>
            <span>Безкоштовно</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Всього</span>
            <span>{formatPrice(totalAmount, 'UAH')}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading || !deliveryData}
        className="w-full bg-primary-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Обробка...' : paymentMethod === PaymentMethodValues.ONLINE ? 'Перейти до оплати' : 'Оформити замовлення'}
      </button>

      {!deliveryData && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Заповніть інформацію про доставку для продовження
        </p>
      )}
    </div>
  )
}
