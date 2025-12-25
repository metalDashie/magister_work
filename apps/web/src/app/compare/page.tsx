'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'
import { useCartStore } from '@/lib/store/cartStore'

interface CompareProduct {
  id: string
  name: string
  sku?: string
  price: number
  currency: string
  stock: number
  images?: string[]
  category?: string
  discountPercent?: number
  discountActive?: boolean
  discountStartDate?: string
  discountEndDate?: string
  averageRating?: number
  reviewsCount?: number
}

interface CompareAttribute {
  id: string
  name: string
  unit: string | null
  sortOrder: number
}

interface CompareData {
  products: CompareProduct[]
  attributes: CompareAttribute[]
  comparison: Record<string, Record<string, any>>
}

export default function ComparePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const addItem = useCartStore((state) => state.addItem)
  const [data, setData] = useState<CompareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[REDIRECT] compare/page.tsx -> /auth/login', {
        authLoading,
        isAuthenticated,
      })
      // router.push('/auth/login?redirect=/compare')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompareData()
    }
  }, [isAuthenticated])

  const fetchCompareData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/compare/data')
      setData(res.data)
    } catch (error) {
      console.error('Failed to fetch compare data:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCompare = async (productId: string) => {
    try {
      setRemoving(productId)
      await api.delete(`/compare/${productId}`)
      fetchCompareData()
    } catch (error) {
      console.error('Failed to remove from compare:', error)
    } finally {
      setRemoving(null)
    }
  }

  const clearAll = async () => {
    try {
      await api.delete('/compare')
      setData({ products: [], attributes: [], comparison: {} })
    } catch (error) {
      console.error('Failed to clear compare list:', error)
    }
  }

  const addToCart = async (product: CompareProduct) => {
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

  const isDiscountActive = (product: CompareProduct) => {
    if (!product.discountActive || !product.discountPercent) return false
    const now = new Date()
    if (product.discountStartDate && now < new Date(product.discountStartDate))
      return false
    if (product.discountEndDate && now > new Date(product.discountEndDate))
      return false
    return true
  }

  const formatAttributeValue = (value: any, unit: string | null): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return unit ? `${value} ${unit}` : String(value)
  }

  const renderStars = (rating: number | undefined) => {
    if (!rating) return <span className="text-gray-400">No ratings</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-500 ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!data || data.products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Compare Products</h1>
        <div className="text-center py-16 bg-white rounded-lg shadow">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No products to compare
          </h2>
          <p className="text-gray-500 mb-6">
            Add products to compare by clicking the compare icon on product
            cards
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Compare Products</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/wishlist"
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>Wishlist</span>
          </Link>
          <button
            onClick={clearAll}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-[600px]">
          {/* Product Images & Names Header */}
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left text-gray-500 font-medium w-48 bg-gray-50">
                Product
              </th>
              {data.products.map((product) => (
                <th key={product.id} className="p-4 text-center min-w-[200px]">
                  <div className="relative">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      disabled={removing === product.id}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                      title="Remove from compare"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <Link href={`/products/${product.id}`}>
                      <div className="w-32 h-32 mx-auto mb-3 relative">
                        <OptimizedImage
                          src={product.images?.[0]}
                          alt={product.name}
                          className="w-full h-full rounded-lg"
                          contentType="product"
                          objectFit="cover"
                        />
                      </div>
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    {product.category && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.category}
                      </p>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Price Row */}
            <tr className="border-b bg-gray-50">
              <td className="p-4 font-medium text-gray-700">Price</td>
              {data.products.map((product) => {
                const hasDiscount = isDiscountActive(product)
                const finalPrice = hasDiscount
                  ? product.price * (1 - (product.discountPercent || 0) / 100)
                  : product.price

                return (
                  <td key={product.id} className="p-4 text-center">
                    {hasDiscount ? (
                      <div>
                        <span className="text-lg font-bold text-red-600">
                          {formatPrice(finalPrice, product.currency)}
                        </span>
                        <br />
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <span className="ml-2 text-xs text-red-500 font-medium">
                          -{product.discountPercent}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Rating Row */}
            <tr className="border-b">
              <td className="p-4 font-medium text-gray-700">Rating</td>
              {data.products.map((product) => (
                <td key={product.id} className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    {renderStars(product.averageRating)}
                    {product.reviewsCount !== undefined &&
                      product.reviewsCount > 0 && (
                        <span className="text-xs text-gray-500 mt-1">
                          {product.reviewsCount} reviews
                        </span>
                      )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Stock Row */}
            <tr className="border-b bg-gray-50">
              <td className="p-4 font-medium text-gray-700">Availability</td>
              {data.products.map((product) => (
                <td key={product.id} className="p-4 text-center">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      In Stock ({product.stock})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* SKU Row */}
            <tr className="border-b">
              <td className="p-4 font-medium text-gray-700">SKU</td>
              {data.products.map((product) => (
                <td key={product.id} className="p-4 text-center text-gray-600">
                  {product.sku || '-'}
                </td>
              ))}
            </tr>

            {/* Dynamic Attributes */}
            {data.attributes.map((attr, index) => (
              <tr
                key={attr.id}
                className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}`}
              >
                <td className="p-4 font-medium text-gray-700">
                  {attr.name}
                  {attr.unit && (
                    <span className="text-gray-400 text-sm ml-1">
                      ({attr.unit})
                    </span>
                  )}
                </td>
                {data.products.map((product) => (
                  <td
                    key={product.id}
                    className="p-4 text-center text-gray-600"
                  >
                    {formatAttributeValue(
                      data.comparison[attr.id]?.[product.id],
                      attr.unit
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Add to Cart Row */}
            <tr className="border-t-2">
              <td className="p-4"></td>
              {data.products.map((product) => (
                <td key={product.id} className="p-4 text-center">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {data.products.length < 4 && (
        <div className="mt-6 text-center">
          <p className="text-gray-500 mb-3">
            You can compare up to 4 products. Currently comparing{' '}
            {data.products.length}.
          </p>
          <Link
            href="/products"
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Add more products to compare
          </Link>
        </div>
      )}
    </div>
  )
}
