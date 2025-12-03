'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { StripePaymentProvider } from '@/components/payment/StripePaymentProvider'
import { StripePaymentForm } from '@/components/payment/StripePaymentForm'
import { formatPrice } from '@fullmag/common'
import Link from 'next/link'

interface Order {
  id: string
  totalAmount: number
  currency: string
  status: string
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    loadOrder()
  }, [_hasHydrated, isAuthenticated, orderId, router])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/orders/${orderId}`)
      const orderData = response.data

      // Check if order is already paid
      if (orderData.status === 'paid') {
        router.push(`/checkout/success?orderId=${orderId}`)
        return
      }

      setOrder(orderData)
    } catch (err: any) {
      console.error('Failed to load order:', err)
      setError(err.response?.data?.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    // Redirect to success page
    router.push(`/checkout/success?orderId=${orderId}`)
  }

  const handlePaymentError = (errorMessage: string) => {
    setPaymentError(errorMessage)
  }

  if (!_hasHydrated || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Order not found'}</h2>
          <Link href="/products" className="text-primary-600 hover:text-primary-800">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/profile/orders" className="text-primary-600 hover:text-primary-800 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
        <p className="mt-2 text-gray-600">Order #{order.id.slice(0, 8)}</p>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="border-t pt-4 flex justify-between items-center">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-primary-600">
            {formatPrice(order.totalAmount, order.currency)}
          </span>
        </div>
      </div>

      {/* Payment Error */}
      {paymentError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {paymentError}
        </div>
      )}

      {/* Stripe Payment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
        <StripePaymentProvider orderId={orderId}>
          <StripePaymentForm
            orderId={orderId}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </StripePaymentProvider>
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
        Your payment is secured with SSL encryption
      </div>
    </div>
  )
}
