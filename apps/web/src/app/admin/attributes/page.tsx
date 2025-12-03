'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Category {
  id: number
  name: string
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
  category?: Category
}

const TYPE_LABELS: Record<string, string> = {
  string: 'Text',
  number: 'Number',
  boolean: 'Yes/No',
  select: 'Single Select',
  multi_select: 'Multi Select',
  range: 'Range',
}

const INPUT_TYPE_LABELS: Record<string, string> = {
  text: 'Text Input',
  number: 'Number Input',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  radio: 'Radio Buttons',
  range_slider: 'Range Slider',
  color_picker: 'Color Picker',
}

export default function AdminAttributesPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    attributeId: string | null
    attributeName: string
  }>({
    isOpen: false,
    attributeId: null,
    attributeName: '',
  })

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      return
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }

    loadData()
  }, [_hasHydrated, isAuthenticated, user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [attributesRes, categoriesRes] = await Promise.all([
        api.get('/attributes'),
        api.get('/categories?flat=true'),
      ])
      setAttributes(attributesRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (attr: Attribute) => {
    setConfirmModal({
      isOpen: true,
      attributeId: attr.id,
      attributeName: attr.name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!confirmModal.attributeId) return

    try {
      await api.delete(`/attributes/${confirmModal.attributeId}`)
      loadData()
    } catch (error: any) {
      console.error('Failed to delete attribute:', error)
      alert(error.response?.data?.message || 'Failed to delete attribute')
    }
  }

  const filteredAttributes = filterCategory
    ? attributes.filter((attr) => {
        if (filterCategory === 'global') return attr.categoryId === null
        return attr.categoryId === filterCategory
      })
    : attributes

  const globalAttributes = attributes.filter((attr) => attr.categoryId === null)
  const categoryAttributes = attributes.filter((attr) => attr.categoryId !== null)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attribute Management</h1>
          <p className="mt-2 text-gray-600">
            Define product attributes for filtering and specifications
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/categories"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Categories
          </Link>
          <Link
            href="/admin/attributes/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Attribute
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Attributes</div>
          <div className="text-2xl font-bold">{attributes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Global Attributes</div>
          <div className="text-2xl font-bold">{globalAttributes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Category-Specific</div>
          <div className="text-2xl font-bold">{categoryAttributes.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Attributes</option>
          <option value="global">Global Only</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Attributes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attribute
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Filterable
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAttributes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No attributes found.{' '}
                  <Link
                    href="/admin/attributes/new"
                    className="text-primary-600 hover:underline"
                  >
                    Add your first attribute
                  </Link>
                </td>
              </tr>
            ) : (
              filteredAttributes.map((attr) => (
                <tr key={attr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{attr.name}</div>
                    <div className="text-xs text-gray-500">slug: {attr.slug}</div>
                    {attr.unit && (
                      <div className="text-xs text-gray-500">Unit: {attr.unit}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {TYPE_LABELS[attr.type] || attr.type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {INPUT_TYPE_LABELS[attr.inputType] || attr.inputType}
                    </div>
                    {attr.options && attr.options.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {attr.options.length} options
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {attr.category ? (
                      <Link
                        href={`/admin/categories/${attr.categoryId}/edit`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {attr.category.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Global</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {attr.isFilterable ? (
                      <span className="text-green-600">
                        <svg
                          className="w-5 h-5 inline"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {attr.isRequired ? (
                      <span className="text-green-600">
                        <svg
                          className="w-5 h-5 inline"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                    <Link
                      href={`/admin/attributes/${attr.id}/edit`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(attr)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, attributeId: null, attributeName: '' })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Attribute"
        message={`Are you sure you want to delete "${confirmModal.attributeName}"? This will remove this attribute from all products.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
