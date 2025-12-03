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
  description?: string
  parentId?: number
  parent?: Category
  children?: Category[]
  _count?: { products: number }
}

interface Attribute {
  id: string
  name: string
  slug: string
  type: string
  categoryId: string | null
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    categoryId: number | null
    categoryName: string
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: '',
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
      const [categoriesRes, attributesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/attributes'),
      ])
      setCategories(categoriesRes.data || [])
      setAttributes(attributesRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<number>()
    const collectIds = (cats: Category[]) => {
      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat.id)
          collectIds(cat.children)
        }
      })
    }
    collectIds(categories)
    setExpandedIds(allIds)
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const handleDeleteClick = (category: Category) => {
    setConfirmModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!confirmModal.categoryId) return

    try {
      await api.delete(`/categories/${confirmModal.categoryId}`)
      loadData()
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      alert(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const getCategoryAttributes = (categoryId: number) => {
    return attributes.filter(
      (attr) => attr.categoryId === String(categoryId) || attr.categoryId === null
    )
  }

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedIds.has(category.id)
    const categoryAttrs = getCategoryAttributes(category.id)

    return (
      <div key={category.id}>
        <div
          className={`flex items-center py-3 px-4 hover:bg-gray-50 border-b border-gray-100 ${
            level > 0 ? 'bg-gray-50/50' : ''
          }`}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {/* Expand/Collapse button */}
          <div className="w-6 mr-2">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Category info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{category.name}</span>
              {hasChildren && (
                <span className="text-xs text-gray-500">
                  ({category.children!.length} subcategories)
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 truncate">{category.description}</p>
            )}
          </div>

          {/* Attributes count */}
          <div className="w-32 text-center">
            <span className="text-sm text-gray-600">
              {categoryAttrs.length} attributes
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Link
              href={`/admin/categories/${category.id}/edit`}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              Edit
            </Link>
            <Link
              href={`/admin/categories/new?parentId=${category.id}`}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Add Sub
            </Link>
            <button
              onClick={() => handleDeleteClick(category)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalCategories = (() => {
    let count = 0
    const countAll = (cats: Category[]) => {
      cats.forEach((cat) => {
        count++
        if (cat.children) countAll(cat.children)
      })
    }
    countAll(categories)
    return count
  })()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="mt-2 text-gray-600">
            Organize your product categories and attributes
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/attributes"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Manage Attributes
          </Link>
          <Link
            href="/admin/categories/new"
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
            Add Category
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Categories</div>
          <div className="text-2xl font-bold">{totalCategories}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Root Categories</div>
          <div className="text-2xl font-bold">{categories.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Attributes</div>
          <div className="text-2xl font-bold">{attributes.length}</div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Categories</h2>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Collapse All
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No categories found.{' '}
            <Link
              href="/admin/categories/new"
              className="text-primary-600 hover:underline"
            >
              Add your first category
            </Link>
          </div>
        ) : (
          <div>{categories.map((cat) => renderCategoryRow(cat))}</div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, categoryId: null, categoryName: '' })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmModal.categoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
