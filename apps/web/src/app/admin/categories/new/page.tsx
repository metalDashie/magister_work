'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  parentId?: number
  parent?: Category
}

export default function NewCategoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentIdParam = searchParams.get('parentId')
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: parentIdParam ? Number(parentIdParam) : null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }

    loadCategories()
  }, [_hasHydrated, isAuthenticated, user, router])

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories?flat=true')
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    setLoading(true)
    try {
      await api.post('/categories', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parentId: formData.parentId || null,
      })
      router.push('/admin/categories')
    } catch (error: any) {
      console.error('Failed to create category:', error)
      setErrors({
        submit: error.response?.data?.message || 'Failed to create category',
      })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryPath = (cat: Category): string => {
    if (cat.parent) {
      return `${getCategoryPath(cat.parent)} > ${cat.name}`
    }
    return cat.name
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/categories"
          className="text-primary-600 hover:text-primary-800 flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Categories
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">New Category</h1>
        <p className="mt-2 text-gray-600">Create a new product category</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errors.submit}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Smartphones"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Optional description for this category"
          />
        </div>

        {/* Parent Category */}
        <div>
          <label
            htmlFor="parentId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Parent Category
          </label>
          <select
            id="parentId"
            value={formData.parentId || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                parentId: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">None (Root Category)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getCategoryPath(cat)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Leave empty to create a root category
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
          <Link
            href="/admin/categories"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
