'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@fullmag/common'
import type { Product } from '@fullmag/common'
import OptimizedImage from '@/components/common/OptimizedImage'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = async () => {
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        price: product.price,
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200">
          <OptimizedImage
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-48"
            contentType="product"
            objectFit="cover"
          />
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            {formatPrice(product.price, product.currency)}
          </span>

          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Add to Cart
            </button>
          ) : (
            <span className="text-red-600 font-semibold">Out of Stock</span>
          )}
        </div>

        {product.stock > 0 && product.stock < 10 && (
          <p className="mt-2 text-sm text-orange-600">
            Only {product.stock} left in stock
          </p>
        )}
      </div>
    </div>
  )
}
