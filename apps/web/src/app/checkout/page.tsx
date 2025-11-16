'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import { DeliveryForm, DeliveryFormData } from '@/components/delivery/DeliveryForm'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { cart, totalAmount, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

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
      // Create order with delivery information
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
      }

      const orderResponse = await api.post('/orders', orderData)
      const order = orderResponse.data

      // Create payment invoice
      const paymentResponse = await api.post('/payments/invoice', {
        orderId: order.id,
        amount: totalAmount,
        currency: 'UAH',
      })

      // Clear cart
      await clearCart()

      // Redirect to payment page
      if (paymentResponse.data.pageUrl) {
        window.location.href = paymentResponse.data.pageUrl
      } else {
        router.push(`/profile/orders/${order.id}`)
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
        <DeliveryForm onDataChange={setDeliveryData} />
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
