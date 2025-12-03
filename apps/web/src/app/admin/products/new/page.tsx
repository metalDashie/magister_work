'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      console.log('[REDIRECT] admin/products/new/page.tsx -> /auth/login', {
        _hasHydrated,
        isAuthenticated,
      })
      // router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }
  }, [_hasHydrated, isAuthenticated, user, router])

  const handleSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError('')

    try {
      await api.post('/products', data)
      router.push('/admin/products')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="mt-2 text-gray-600">
          Create a new product in your catalog
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <ProductForm
          onSubmit={handleSubmit}
          submitText="Create Product"
          isLoading={loading}
        />
      </div>
    </div>
  )
}
