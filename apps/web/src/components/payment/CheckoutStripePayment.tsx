'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'

interface CheckoutStripePaymentProps {
  orderId: string
  onSuccess: () => void
  onError: (error: string) => void
}

function StripePaymentFormInner({
  onSuccess,
  onError,
}: {
  onSuccess: () => void
  onError: (error: string) => void
}) {
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
        onError(error.message || 'Помилка оплати')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend to update order status
        try {
          await api.post('/payments/confirm', { paymentIntentId: paymentIntent.id })
        } catch (confirmErr) {
          console.error('Failed to confirm payment on backend:', confirmErr)
        }
        onSuccess()
      }
    } catch (err: any) {
      onError(err.message || 'Помилка обробки платежу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Тестовий режим:</strong> Використайте номер картки{' '}
          <code className="bg-white px-2 py-1 rounded font-mono">4242 4242 4242 4242</code>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Будь-яка майбутня дата закінчення, будь-який CVC та будь-який поштовий індекс
        </p>
      </div>

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Обробка...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Оплатити
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Powered by Stripe - Ваші платіжні дані в безпеці
      </p>
    </form>
  )
}

export function CheckoutStripePayment({
  orderId,
  onSuccess,
  onError,
}: CheckoutStripePaymentProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Get Stripe publishable key
        const configRes = await api.get('/payments/config')
        const publishableKey = configRes.data.publishableKey

        if (!publishableKey) {
          setError('Stripe не налаштовано')
          setLoading(false)
          return
        }

        // Load Stripe
        const stripe = loadStripe(publishableKey)
        setStripePromise(stripe)

        // Create payment intent
        const intentRes = await api.post('/payments/create-intent', { orderId })
        setClientSecret(intentRes.data.clientSecret)
      } catch (err: any) {
        console.error('Failed to initialize Stripe:', err)
        setError(err.response?.data?.message || 'Не вдалося ініціалізувати платіжну систему')
        onError(err.response?.data?.message || 'Помилка ініціалізації платежу')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      initializeStripe()
    }
  }, [orderId, onError])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Завантаження платіжної форми...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold">Помилка</span>
        </div>
        <p>{error}</p>
      </div>
    )
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Платіжна система не готова. Спробуйте ще раз.</span>
        </div>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        fontFamily: 'system-ui, sans-serif',
      },
      rules: {
        '.Label': {
          marginBottom: '8px',
        },
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentFormInner onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
