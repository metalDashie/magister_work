'use client'

import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { api } from '@/lib/api'

interface StripePaymentFormProps {
  orderId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function StripePaymentForm({
  orderId,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend to update order status
        try {
          await api.post('/payments/confirm', { paymentIntentId: paymentIntent.id })
        } catch (confirmErr) {
          console.error('Failed to confirm payment on backend:', confirmErr)
          // Still proceed to success as Stripe payment succeeded
        }
        onSuccess()
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Test Mode:</strong> Use card number <code className="bg-white px-2 py-1 rounded">4242 4242 4242 4242</code>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Any future expiry date, any CVC, and any 5-digit postal code
        </p>
      </div>

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>

      <p className="text-xs text-center text-gray-500">
        Powered by Stripe - Your payment information is secure
      </p>
    </form>
  )
}
