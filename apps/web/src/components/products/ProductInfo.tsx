'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@fullmag/common'
import { useCartStore } from '@/lib/store/cartStore'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface ProductInfoProps {
  product: {
    id: string
    name: string
    sku?: string
    price: number
    currency: string
    stock: number
    images?: string[]
    averageRating?: number | null
    reviewsCount: number
    discountPercent?: number | null
    discountActive?: boolean
    discountStartDate?: string | null
    discountEndDate?: string | null
    category?: {
      id: number
      name: string
    }
  }
}

function isDiscountActive(product: ProductInfoProps['product']): boolean {
  if (!product.discountActive || !product.discountPercent) return false
  const now = new Date()
  if (product.discountStartDate && now < new Date(product.discountStartDate)) return false
  if (product.discountEndDate && now > new Date(product.discountEndDate)) return false
  return true
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter()
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasActiveDiscount = isDiscountActive(product)
  const finalPrice = hasActiveDiscount
    ? product.price * (1 - (product.discountPercent || 0) / 100)
    : product.price

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      await addItem({
        productId: product.id,
        quantity,
        price: finalPrice,
        product: {
          id: product.id,
          name: product.name,
          images: product.images,
          stock: product.stock,
        },
      })
      router.push('/cart')
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
        productId: product.id,
        quantity,
        price: finalPrice,
        product: {
          id: product.id,
          name: product.name,
          images: product.images,
          stock: product.stock,
        },
      })
      router.push('/checkout')
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setWishlistLoading(true)
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product.id}`)
      } else {
        await api.post('/wishlist', { productId: product.id })
      }
      setIsWishlisted(!isWishlisted)
    } catch (error) {
      console.error('Failed to update wishlist:', error)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleShare = async (platform: string) => {
    const url = window.location.href
    const text = `Check out ${product.name}`

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
        break
    }
    setShowShareMenu(false)
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Title and SKU */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
        {product.sku && (
          <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
        )}
      </div>

      {/* Rating */}
      {product.reviewsCount > 0 && (
        <div className="flex items-center gap-3">
          {renderStars(product.averageRating || 0)}
          <span className="text-sm text-gray-600">
            {product.averageRating?.toFixed(1)} ({product.reviewsCount} reviews)
          </span>
        </div>
      )}

      {/* Price */}
      <div className="py-4 border-y border-gray-200">
        {hasActiveDiscount ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.price, product.currency)}
              </span>
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                -{product.discountPercent}%
              </span>
            </div>
            <span className="text-3xl lg:text-4xl font-bold text-red-600">
              {formatPrice(finalPrice, product.currency)}
            </span>
            {product.discountEndDate && (
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sale ends: {new Date(product.discountEndDate).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <span className="text-3xl lg:text-4xl font-bold text-primary-600">
            {formatPrice(product.price, product.currency)}
          </span>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {product.stock > 0 ? (
          <>
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-green-700 font-medium">In Stock</span>
            {product.stock < 10 && (
              <span className="text-orange-600 text-sm">
                (Only {product.stock} left)
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="text-red-700 font-medium">Out of Stock</span>
          </>
        )}
      </div>

      {/* Quantity Selector */}
      {product.stock > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-gray-700 font-medium">Quantity:</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 hover:bg-gray-100 transition-colors"
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
              className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
              min={1}
              max={product.stock}
            />
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="px-4 py-2 hover:bg-gray-100 transition-colors"
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {product.stock > 0 ? (
          <>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-primary-600 text-white py-3.5 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={addingToCart}
              className="w-full bg-gray-900 text-white py-3.5 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Buy Now
            </button>
          </>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-3.5 rounded-lg text-lg font-semibold cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}

        {/* Wishlist & Share */}
        <div className="flex gap-3">
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`flex-1 py-3 rounded-lg border font-medium transition-colors flex items-center justify-center gap-2 ${
              isWishlisted
                ? 'border-red-500 text-red-500 bg-red-50'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('telegram')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category */}
      {product.category && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Category:{' '}
            <a
              href={`/products?category=${product.category.id}`}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              {product.category.name}
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
