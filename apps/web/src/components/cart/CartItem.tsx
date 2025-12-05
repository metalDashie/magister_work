'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'

interface CartItemProps {
  item: any
  isLocalCart?: boolean
}

export default function CartItem({ item, isLocalCart = false }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore()
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Get product ID for local cart operations
  const productId = item.productId || item.product?.id
  const itemId = item.id

  const maxStock = item.product?.stock || 99
  const isOutOfStock = maxStock === 0

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxStock) return
    if (updating) return

    setUpdating(true)
    try {
      await updateQuantity(itemId, newQuantity, productId)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await removeItem(itemId, productId)
    } catch (error) {
      console.error('Failed to remove item:', error)
      setRemoving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    setShowDeleteConfirm(false)
    handleRemove()
  }

  // Get the correct image source
  const imageSource = item.product?.images?.[0] || item.product?.imageUrl

  return (
    <div className={`flex items-center py-6 border-b last:border-b-0 ${removing ? 'opacity-50' : ''}`}>
      {/* Product Image */}
      <Link href={`/products/${productId}`} className="flex-shrink-0">
        <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden hover:opacity-75 transition-opacity">
          <OptimizedImage
            src={imageSource}
            alt={item.product?.name || 'Товар'}
            className="w-full h-full rounded-md"
            contentType="product"
            objectFit="cover"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="ml-4 flex-1">
        <Link href={`/products/${productId}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
            {item.product?.name || 'Товар'}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          {formatPrice(item.price, 'UAH')} за шт.
        </p>

        {/* Stock Warning */}
        {isOutOfStock && (
          <span className="inline-block mt-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
            Немає в наявності
          </span>
        )}
        {!isOutOfStock && item.quantity > maxStock && (
          <span className="inline-block mt-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Доступно лише {maxStock} шт.
          </span>
        )}

        {/* Local cart indicator */}
        {isLocalCart && (
          <span className="inline-block mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">
            Локальний кошик
          </span>
        )}
      </div>

      {/* Quantity Controls & Price */}
      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Quantity Controls */}
        <div className="flex flex-col items-center">
          <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || updating || removing}
              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Зменшити кількість"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="px-4 py-2 border-x-2 border-gray-300 min-w-[60px] text-center font-semibold">
              {updating ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
              ) : (
                item.quantity
              )}
            </div>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= maxStock || updating || removing}
              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Збільшити кількість"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {maxStock > 0 && maxStock < 99 && (
            <span className="text-xs text-gray-500 mt-1">Макс: {maxStock}</span>
          )}
        </div>

        {/* Total Price */}
        <div className="text-lg font-bold text-gray-900 w-28 text-right">
          {formatPrice(item.price * item.quantity, 'UAH')}
        </div>

        {/* Delete Button */}
        <div className="relative">
          <button
            onClick={handleDeleteClick}
            disabled={removing}
            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            aria-label="Видалити товар"
            title="Видалити з кошика"
          >
            {removing ? (
              <div className="animate-spin h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>

          {/* Delete Confirmation Popup */}
          {showDeleteConfirm && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => setShowDeleteConfirm(false)}
              ></div>
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 z-50 w-64">
                <p className="text-sm text-gray-900 font-medium mb-3">
                  Видалити товар з кошика?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Видалити
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
