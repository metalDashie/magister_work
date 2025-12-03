'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import CartItem from '@/components/cart/CartItem'
import { formatPrice } from '@fullmag/common'
import Link from 'next/link'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const { cart, totalAmount, fetchCart, clearCart } = useCartStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return

    if (isAuthenticated) {
      fetchCart()
      return
    }
  }, [_hasHydrated, isAuthenticated, fetchCart, router])

  // Show loading while hydrating to prevent flash of empty cart
  if (!_hasHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const handleClearCart = async () => {
    setClearing(true)
    try {
      await clearCart()
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear cart:', error)
    } finally {
      setClearing(false)
    }
  }

  const itemCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Start shopping to add items to your cart
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 transition-colors font-semibold"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} (
            {itemCount} total units)
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-red-600 hover:text-red-800 font-medium flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-md transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatPrice(totalAmount, 'UAH')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3 flex justify-between font-bold text-xl">
                <span>Total</span>
                <span className="text-primary-600">
                  {formatPrice(totalAmount, 'UAH')}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-primary-600 text-white text-center py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors mb-3"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className="block w-full text-center text-primary-600 hover:text-primary-700 py-2 font-medium"
            >
              Continue Shopping
            </Link>

            {/* Security Badge */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => !clearing && setShowClearConfirm(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
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
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Clear Entire Cart?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                This will remove all {cart.items.length} items from your cart.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearCart}
                  disabled={clearing}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 font-semibold disabled:opacity-50 transition-colors"
                >
                  {clearing ? 'Clearing...' : 'Yes, Clear Cart'}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-300 font-semibold disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
