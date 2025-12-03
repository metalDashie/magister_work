'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'

interface StripePaymentProviderProps {
  orderId: string
  children: React.ReactNode
}

export function StripePaymentProvider({
  orderId,
  children,
}: StripePaymentProviderProps) {
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
          setError('Stripe is not configured')
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
        setError(err.response?.data?.message || 'Failed to initialize payment')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      initializeStripe()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    )
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        Payment system is not ready
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}
