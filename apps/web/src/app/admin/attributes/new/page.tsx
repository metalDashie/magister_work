'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  parent?: Category
}

const ATTRIBUTE_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'range', label: 'Range' },
]

const INPUT_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'range_slider', label: 'Range Slider' },
  { value: 'color_picker', label: 'Color Picker' },
]

export default function NewAttributePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryIdParam = searchParams.get('categoryId')
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'string',
    inputType: 'text',
    options: '',
    unit: '',
    isFilterable: true,
    isRequired: false,
    isVisible: true,
    sortOrder: 0,
    categoryId: categoryIdParam || '',
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    if (!formData.slug.trim()) {
      setErrors({ slug: 'Slug is required' })
      return
    }

    if (
      (formData.type === 'select' || formData.type === 'multi_select') &&
      !formData.options.trim()
    ) {
      setErrors({ options: 'Options are required for select types' })
      return
    }

    setLoading(true)
    try {
      const options = formData.options
        ? formData.options.split('\n').filter((o) => o.trim())
        : null

      await api.post('/attributes', {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        inputType: formData.inputType,
        options,
        unit: formData.unit.trim() || null,
        isFilterable: formData.isFilterable,
        isRequired: formData.isRequired,
        isVisible: formData.isVisible,
        sortOrder: formData.sortOrder,
        categoryId: formData.categoryId || null,
      })
      router.push('/admin/attributes')
    } catch (error: any) {
      console.error('Failed to create attribute:', error)
      setErrors({
        submit: error.response?.data?.message || 'Failed to create attribute',
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

  const showOptionsField =
    formData.type === 'select' || formData.type === 'multi_select'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/attributes"
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
          Back to Attributes
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">New Attribute</h1>
        <p className="mt-2 text-gray-600">Create a new product attribute</p>
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
            Attribute Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Screen Size"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.slug ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., screen_size"
          />
          {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Used for filtering and API. Use lowercase with underscores.
          </p>
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
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Optional description"
          />
        </div>

        {/* Type & Input Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ATTRIBUTE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="inputType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Input Type *
            </label>
            <select
              id="inputType"
              value={formData.inputType}
              onChange={(e) => setFormData({ ...formData, inputType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {INPUT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Options (for select types) */}
        {showOptionsField && (
          <div>
            <label
              htmlFor="options"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Options * (one per line)
            </label>
            <textarea
              id="options"
              value={formData.options}
              onChange={(e) => setFormData({ ...formData, options: e.target.value })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.options ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Red&#10;Blue&#10;Green"
            />
            {errors.options && (
              <p className="mt-1 text-sm text-red-500">{errors.options}</p>
            )}
          </div>
        )}

        {/* Unit */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <input
            type="text"
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., GB, inches, MP"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional unit suffix for numeric values
          </p>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="categoryId"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Global (All Categories)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {getCategoryPath(cat)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Global attributes apply to all products
          </p>
        </div>

        {/* Sort Order */}
        <div>
          <label
            htmlFor="sortOrder"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sort Order
          </label>
          <input
            type="number"
            id="sortOrder"
            value={formData.sortOrder}
            onChange={(e) =>
              setFormData({ ...formData, sortOrder: Number(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Boolean flags */}
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isFilterable}
              onChange={(e) =>
                setFormData({ ...formData, isFilterable: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Filterable (show in product filters)
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isRequired}
              onChange={(e) =>
                setFormData({ ...formData, isRequired: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Required (must be filled for products)
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isVisible}
              onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Visible (show on product page)
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Attribute'}
          </button>
          <Link
            href="/admin/attributes"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
