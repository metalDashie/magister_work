'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@fullmag/common'

interface CartItemProps {
  item: any
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore()

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    await updateQuantity(item.id, newQuantity)
  }

  const handleRemove = async () => {
    await removeItem(item.id)
  }

  return (
    <div className="flex items-center py-6 border-b">
      <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md">
        {item.product?.images?.[0] ? (
          <img
            src={item.product.images[0]}
            alt={item.product.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="ml-4 flex-1">
        <h3 className="text-lg font-semibold text-gray-900">
          {item.product?.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {formatPrice(item.price, 'UAH')} each
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center border rounded-md">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="px-3 py-1 hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-4 py-1 border-x">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="px-3 py-1 hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <div className="text-lg font-semibold text-gray-900 w-24 text-right">
          {formatPrice(item.price * item.quantity, 'UAH')}
        </div>

        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-800"
        >
          <svg
            className="w-6 h-6"
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
        </button>
      </div>
    </div>
  )
}
