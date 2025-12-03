'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm'

interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  currency: string
  stock: number
  categoryId?: number
  images?: string[]
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      console.log(
        '[REDIRECT] admin/products/[id]/edit/page.tsx -> /auth/login',
        { _hasHydrated, isAuthenticated }
      )
      // router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }

    loadProduct()
  }, [_hasHydrated, isAuthenticated, user, router, productId])

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`)
      setProduct(response.data)
    } catch (err: any) {
      setError('Failed to load product')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError('')

    try {
      await api.put(`/products/${productId}`, data)
      router.push('/admin/products')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product')
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Product not found
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-2 text-gray-600">Update product information</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <ProductForm
          initialData={product}
          onSubmit={handleSubmit}
          submitText="Update Product"
          isLoading={loading}
        />
      </div>
    </div>
  )
}
