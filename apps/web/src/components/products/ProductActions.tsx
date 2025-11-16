'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'

interface ProductActionsProps {
  productId: string
  price: number
  stock: number
}

export default function ProductActions({
  productId,
  price,
  stock,
}: ProductActionsProps) {
  const router = useRouter()
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      await addItem({
        productId,
        quantity,
        price,
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
          <label className="text-gray-700 font-medium">Quantity:</label>
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 hover:bg-gray-100"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="px-6 py-2 border-x">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2 hover:bg-gray-100"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {stock > 0 ? (
          <>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-primary-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            {stock < 10 && (
              <p className="mt-2 text-sm text-orange-600">
                Only {stock} left in stock - order soon
              </p>
            )}
          </>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-3 rounded-md text-lg font-semibold cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>
    </>
  )
}
