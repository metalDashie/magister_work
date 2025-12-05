'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'

interface ProductActionsProps {
  productId: string
  productName: string
  price: number
  stock: number
  images?: string[]
}

export default function ProductActions({
  productId,
  productName,
  price,
  stock,
  images,
}: ProductActionsProps) {
  const router = useRouter()
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      await addItem({
        productId,
        quantity,
        price,
        product: {
          id: productId,
          name: productName,
          images: images,
          stock,
        },
      })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    setAddingToCart(true)
    try {
      await addItem({
        productId,
        quantity,
        price,
        product: {
          id: productId,
          name: productName,
          images: images,
          stock,
        },
      })
      router.push('/cart')
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center space-x-4">
          <label className="text-gray-700 font-medium">Кількість:</label>
          <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Зменшити кількість"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="px-6 py-2 border-x-2 border-gray-300 font-semibold min-w-[60px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              disabled={quantity >= stock}
              className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Збільшити кількість"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {stock > 0 && stock < 20 && (
            <span className="text-sm text-gray-500">Макс: {stock}</span>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {stock > 0 ? (
          <>
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`w-full py-3 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                showSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              } disabled:opacity-50`}
            >
              {addingToCart ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Додавання...</span>
                </>
              ) : showSuccess ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Додано до кошика!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Додати до кошика</span>
                </>
              )}
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={addingToCart}
              className="w-full py-3 rounded-lg text-lg font-semibold border-2 border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Купити зараз</span>
            </button>

            {stock < 10 && (
              <p className="text-sm text-orange-600 text-center">
                Залишилось лише {stock} шт. - замовляйте швидше!
              </p>
            )}
          </>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg text-lg font-semibold cursor-not-allowed"
          >
            Немає в наявності
          </button>
        )}
      </div>
    </>
  )
}
