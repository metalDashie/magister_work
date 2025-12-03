'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  description?: string
  parentId?: number
  parent?: Category
  children?: Category[]
}

interface Attribute {
  id: string
  name: string
  slug: string
  type: string
  inputType: string
  options?: string[]
  unit?: string
  isFilterable: boolean
  isRequired: boolean
  isVisible: boolean
  sortOrder: number
  categoryId: string | null
}

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = Number(params.id)
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  const [category, setCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryAttributes, setCategoryAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null as number | null,
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

    loadData()
  }, [_hasHydrated, isAuthenticated, user, router, categoryId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [categoryRes, categoriesRes, attributesRes] = await Promise.all([
        api.get(`/categories/${categoryId}`),
        api.get('/categories?flat=true'),
        api.get(`/attributes?categoryId=${categoryId}`),
      ])

      const cat = categoryRes.data
      setCategory(cat)
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        parentId: cat.parentId || null,
      })
      setCategories(categoriesRes.data || [])
      setCategoryAttributes(
        (attributesRes.data || []).filter(
          (attr: Attribute) => attr.categoryId === String(categoryId)
        )
      )
    } catch (error) {
      console.error('Failed to load category:', error)
      router.push('/admin/categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    setSaving(true)
    try {
      await api.patch(`/categories/${categoryId}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parentId: formData.parentId || null,
      })
      router.push('/admin/categories')
    } catch (error: any) {
      console.error('Failed to update category:', error)
      setErrors({
        submit: error.response?.data?.message || 'Failed to update category',
      })
    } finally {
      setSaving(false)
    }
  }

  const getCategoryPath = (cat: Category): string => {
    if (cat.parent) {
      return `${getCategoryPath(cat.parent)} > ${cat.name}`
    }
    return cat.name
  }

  const getAvailableParents = () => {
    // Filter out current category and its descendants
    const descendantIds = new Set<number>()
    const collectDescendants = (cats: Category[]) => {
      cats.forEach((cat) => {
        if (cat.id === categoryId) {
          descendantIds.add(cat.id)
          if (cat.children) {
            const addChildren = (children: Category[]) => {
              children.forEach((child) => {
                descendantIds.add(child.id)
                if (child.children) addChildren(child.children)
              })
            }
            addChildren(cat.children)
          }
        }
      })
    }
    collectDescendants(categories)

    return categories.filter((cat) => !descendantIds.has(cat.id) && cat.id !== categoryId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
        <p className="mt-2 text-gray-600">Update category details and manage attributes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 space-y-6"
          >
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errors.submit}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                {getAvailableParents().map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryPath(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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

        {/* Sidebar - Category Info & Attributes */}
        <div className="space-y-6">
          {/* Children */}
          {category?.children && category.children.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Subcategories</h3>
              <ul className="space-y-2">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/admin/categories/${child.id}/edit`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Attributes */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Category Attributes</h3>
              <Link
                href={`/admin/attributes/new?categoryId=${categoryId}`}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                + Add
              </Link>
            </div>

            {categoryAttributes.length === 0 ? (
              <p className="text-sm text-gray-500">
                No attributes specific to this category.
              </p>
            ) : (
              <ul className="space-y-2">
                {categoryAttributes.map((attr) => (
                  <li
                    key={attr.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {attr.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">({attr.type})</span>
                    </div>
                    <Link
                      href={`/admin/attributes/${attr.id}/edit`}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/admin/categories/new?parentId=${categoryId}`}
                className="block text-sm text-primary-600 hover:underline"
              >
                + Add Subcategory
              </Link>
              <Link
                href={`/admin/attributes/new?categoryId=${categoryId}`}
                className="block text-sm text-primary-600 hover:underline"
              >
                + Add Attribute
              </Link>
              <Link
                href={`/products?category=${categoryId}`}
                className="block text-sm text-primary-600 hover:underline"
              >
                View Products in Category
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
