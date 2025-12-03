'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { useAuthStore } from '@/lib/store/authStore'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface ProductWithDiscount {
  id: string
  name: string
  price: number
  currency: string
  stock: number
  description?: string
  images?: string[]
  category?: {
    id: number
    name: string
  }
  discountPercent?: number | null
  discountStartDate?: string | Date | null
  discountEndDate?: string | Date | null
  discountActive?: boolean
}

interface ProductCardProps {
  product: ProductWithDiscount
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const { isAuthenticated } = useAuthStore()
  const [isAdding, setIsAdding] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [inCompare, setInCompare] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      api.get(`/wishlist/check/${product.id}`)
        .then(res => setInWishlist(res.data.inWishlist))
        .catch(() => {})
      api.get(`/compare/${product.id}/check`)
        .then(res => setInCompare(res.data.inCompareList))
        .catch(() => {})
    }
  }, [isAuthenticated, product.id])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated || wishlistLoading) return

    setWishlistLoading(true)
    try {
      const res = await api.post(`/wishlist/${product.id}/toggle`)
      setInWishlist(res.data.added)
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    } finally {
      setWishlistLoading(false)
    }
  }

  const toggleCompare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated || compareLoading) return

    setCompareLoading(true)
    try {
      const res = await api.post(`/compare/${product.id}/toggle`)
      setInCompare(res.data.added)
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'Cannot add more than 4 products to compare')
      }
      console.error('Failed to toggle compare:', error)
    } finally {
      setCompareLoading(false)
    }
  }

  // Check if discount is currently active
  const isDiscountActive = () => {
    if (!product.discountActive || !product.discountPercent) {
      return false
    }
    const now = new Date()
    if (product.discountStartDate && now < new Date(product.discountStartDate)) {
      return false
    }
    if (product.discountEndDate && now > new Date(product.discountEndDate)) {
      return false
    }
    return true
  }

  const hasActiveDiscount = isDiscountActive()
  const finalPrice = hasActiveDiscount
    ? product.price * (1 - (product.discountPercent || 0) / 100)
    : product.price

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isAdding) return

    setIsAdding(true)
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        price: finalPrice,
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setTimeout(() => setIsAdding(false), 500)
    }
  }

  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock < 10

  return (
    <Link href={`/products/${product.id}`}>
      <div
        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <OptimizedImage
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
            contentType="product"
            objectFit="cover"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasActiveDiscount && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                -{product.discountPercent}%
              </span>
            )}
            {isOutOfStock && (
              <span className="px-3 py-1 bg-gray-900/80 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                Out of Stock
              </span>
            )}
            {isLowStock && (
              <span className="px-3 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {isAuthenticated && (
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className="w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-200"
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  className={`w-5 h-5 transition-colors ${inWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                  fill={inWishlist ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              {/* Compare Button */}
              <button
                onClick={toggleCompare}
                disabled={compareLoading}
                className={`w-9 h-9 flex items-center justify-center backdrop-blur-sm rounded-full shadow-md transition-all duration-200 ${
                  inCompare ? 'bg-primary-600 text-white' : 'bg-white/90 hover:bg-white text-gray-400'
                }`}
                title={inCompare ? 'Remove from compare' : 'Add to compare'}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Quick Add Button - Shows on Hover */}
          {!isOutOfStock && (
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transform transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full py-2.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-primary-600 hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isAdding ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Tag */}
          {product.category && (
            <span className="inline-block text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-md mb-2">
              {product.category.name}
            </span>
          )}

          {/* Product Name */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
              {product.description}
            </p>
          )}

          {/* Price & Stock */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              {hasActiveDiscount ? (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(finalPrice, product.currency)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
            </div>

            {/* Stock Indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500'}`} />
              <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
