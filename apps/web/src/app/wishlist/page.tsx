'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    price: number
    currency: string
    stock: number
    images?: string[]
    discountPercent?: number
    discountActive?: boolean
    discountStartDate?: string
    discountEndDate?: string
    category?: {
      name: string
    }
  }
}

export default function WishlistPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const addItem = useCartStore((state) => state.addItem)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // if (!authLoading && !isAuthenticated) {
    //   router.push('/auth/login?redirect=/wishlist')
    // }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist()
    }
  }, [isAuthenticated])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const res = await api.get('/wishlist')
      setItems(res.data.items)
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      await api.delete(`/wishlist/${productId}`)
      setItems(items.filter((item) => item.productId !== productId))
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    }
  }

  const addToCart = async (item: WishlistItem) => {
    const product = item.product
    const hasActiveDiscount = isDiscountActive(product)
    const finalPrice = hasActiveDiscount
      ? product.price * (1 - (product.discountPercent || 0) / 100)
      : product.price

    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        price: finalPrice,
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const isDiscountActive = (product: WishlistItem['product']) => {
    if (!product.discountActive || !product.discountPercent) return false
    const now = new Date()
    if (product.discountStartDate && now < new Date(product.discountStartDate))
      return false
    if (product.discountEndDate && now > new Date(product.discountEndDate))
      return false
    return true
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Save items you love by clicking the heart icon on products
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-6">
            {items.length} items in your wishlist
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = item.product
              const hasDiscount = isDiscountActive(product)
              const finalPrice = hasDiscount
                ? product.price * (1 - (product.discountPercent || 0) / 100)
                : product.price
              const isOutOfStock = product.stock <= 0

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow"
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="relative aspect-square bg-gray-100">
                      <OptimizedImage
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full"
                        contentType="product"
                        objectFit="cover"
                      />
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                          -{product.discountPercent}%
                        </span>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    {product.category && (
                      <span className="text-xs text-primary-600 font-medium">
                        {product.category.name}
                      </span>
                    )}
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 mt-1">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mt-2">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(finalPrice, product.currency)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.price, product.currency)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => addToCart(item)}
                        disabled={isOutOfStock}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Remove from wishlist"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
