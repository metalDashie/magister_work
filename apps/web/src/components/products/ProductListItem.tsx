'use client'

import Link from 'next/link'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'
import { useCartStore } from '@/lib/store/cartStore'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  price: number
  currency: string
  stock: number
  images?: string[]
  description?: string
  category?: {
    id: number
    name: string
  }
}

interface ProductListItemProps {
  product: Product
}

export default function ProductListItem({ product }: ProductListItemProps) {
  const { addToCart } = useCartStore()
  const [adding, setAdding] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.stock === 0) return

    setAdding(true)
    try {
      await addToCart(product.id, product.price)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow flex gap-6 p-4 group"
    >
      {/* Product Image */}
      <div className="flex-shrink-0 w-48 h-48">
        <OptimizedImage
          src={product.images?.[0]}
          alt={product.name}
          className="w-full h-full rounded-md"
          contentType="product"
          objectFit="cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          {product.category && (
            <span className="text-xs text-primary-600 font-semibold uppercase tracking-wide">
              {product.category.name}
            </span>
          )}

          {/* Product Name */}
          <h3 className="text-xl font-semibold text-gray-900 mt-1 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Stock Status */}
          <div className="mt-3">
            {product.stock > 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div>
            <span className="text-2xl font-bold text-primary-600">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || adding}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {adding ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Add to Cart
              </span>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
