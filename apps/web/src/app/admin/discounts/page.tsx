'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import Pagination from '@/components/common/Pagination'

interface Product {
  id: string
  name: string
  sku?: string
  price: number
  currency: string
  stock: number
  discountPercent: number | null
  discountStartDate: string | null
  discountEndDate: string | null
  discountActive: boolean
  category?: {
    id: number
    name: string
  }
}

interface DiscountStats {
  totalDiscounted: number
  activeDiscounts: number
  scheduledDiscounts: number
  expiredDiscounts: number
  averageDiscount: number
}

export default function AdminDiscountsPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<DiscountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountForm, setDiscountForm] = useState({
    discountPercent: 10,
    discountStartDate: '',
    discountEndDate: '',
    discountActive: true,
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

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

    loadProducts()
    loadStats()
  }, [_hasHydrated, isAuthenticated, user, router, page, searchQuery])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products', {
        params: {
          page,
          limit: 20,
          search: searchQuery || undefined,
        },
      })
      setProducts(response.data.data || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/products/discounts/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load discount stats:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const openDiscountModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setDiscountForm({
        discountPercent: product.discountPercent || 10,
        discountStartDate: product.discountStartDate
          ? new Date(product.discountStartDate).toISOString().slice(0, 16)
          : '',
        discountEndDate: product.discountEndDate
          ? new Date(product.discountEndDate).toISOString().slice(0, 16)
          : '',
        discountActive: product.discountActive,
      })
    } else {
      setEditingProduct(null)
      setDiscountForm({
        discountPercent: 10,
        discountStartDate: '',
        discountEndDate: '',
        discountActive: true,
      })
    }
    setShowDiscountModal(true)
  }

  const handleSetDiscount = async () => {
    try {
      const data = {
        discountPercent: discountForm.discountPercent,
        discountStartDate: discountForm.discountStartDate || null,
        discountEndDate: discountForm.discountEndDate || null,
        discountActive: discountForm.discountActive,
      }

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}/discount`, data)
      } else if (selectedProducts.length > 0) {
        await api.post('/products/discounts/bulk', {
          productIds: selectedProducts,
          ...data,
        })
        setSelectedProducts([])
      }

      setShowDiscountModal(false)
      loadProducts()
      loadStats()
    } catch (error) {
      console.error('Failed to set discount:', error)
      alert('Failed to set discount')
    }
  }

  const handleRemoveDiscount = async (productId: string) => {
    try {
      await api.delete(`/products/${productId}/discount`)
      loadProducts()
      loadStats()
    } catch (error) {
      console.error('Failed to remove discount:', error)
      alert('Failed to remove discount')
    }
  }

  const handleBulkRemoveDiscount = async () => {
    if (selectedProducts.length === 0) return

    try {
      await api.delete('/products/discounts/bulk', {
        data: { productIds: selectedProducts },
      })
      setSelectedProducts([])
      loadProducts()
      loadStats()
    } catch (error) {
      console.error('Failed to remove discounts:', error)
      alert('Failed to remove discounts')
    }
  }

  const getDiscountStatus = (product: Product) => {
    if (!product.discountActive || !product.discountPercent) {
      return { label: 'No discount', color: 'gray' }
    }

    const now = new Date()
    const startDate = product.discountStartDate
      ? new Date(product.discountStartDate)
      : null
    const endDate = product.discountEndDate
      ? new Date(product.discountEndDate)
      : null

    if (startDate && now < startDate) {
      return { label: 'Scheduled', color: 'blue' }
    }
    if (endDate && now > endDate) {
      return { label: 'Expired', color: 'red' }
    }
    return { label: 'Active', color: 'green' }
  }

  const calculateFinalPrice = (product: Product) => {
    const status = getDiscountStatus(product)
    if (status.label !== 'Active') {
      return product.price
    }
    return product.price * (1 - (product.discountPercent || 0) / 100)
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discount Management</h1>
        <p className="mt-2 text-gray-600">Set and manage product discounts</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Discounted</div>
            <div className="text-2xl font-bold">{stats.totalDiscounted}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-700">Active</div>
            <div className="text-2xl font-bold text-green-700">
              {stats.activeDiscounts}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-700">Scheduled</div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.scheduledDiscounts}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-700">Expired</div>
            <div className="text-2xl font-bold text-red-700">
              {stats.expiredDiscounts}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="text-sm text-purple-700">Avg Discount</div>
            <div className="text-2xl font-bold text-purple-700">
              {stats.averageDiscount}%
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>

        <div className="flex gap-3">
          {selectedProducts.length > 0 && (
            <>
              <button
                onClick={handleBulkRemoveDiscount}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Discounts ({selectedProducts.length})
              </button>
              <button
                onClick={() => openDiscountModal()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Set Discount ({selectedProducts.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedProducts.length === products.length &&
                      products.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const status = getDiscountStatus(product)
                  const finalPrice = calculateFinalPrice(product)

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.sku || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price, product.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.discountPercent ? (
                          <span className="text-lg font-bold text-red-600">
                            -{product.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-sm font-semibold ${
                            status.label === 'Active'
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {formatPrice(finalPrice, product.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.discountStartDate || product.discountEndDate ? (
                          <div className="text-xs text-gray-500">
                            {product.discountStartDate && (
                              <div>
                                From:{' '}
                                {new Date(
                                  product.discountStartDate
                                ).toLocaleDateString()}
                              </div>
                            )}
                            {product.discountEndDate && (
                              <div>
                                Until:{' '}
                                {new Date(
                                  product.discountEndDate
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openDiscountModal(product)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {product.discountPercent ? 'Edit' : 'Set'}
                        </button>
                        {product.discountPercent && (
                          <button
                            onClick={() => handleRemoveDiscount(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={20}
          onPageChange={setPage}
          showPageNumbers={true}
        />
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct
                ? `Set Discount for ${editingProduct.name}`
                : `Set Discount for ${selectedProducts.length} products`}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountForm.discountPercent}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="absolute right-4 top-2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={discountForm.discountStartDate}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      discountStartDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={discountForm.discountEndDate}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      discountEndDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="discountActive"
                  checked={discountForm.discountActive}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      discountActive: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="discountActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Active
                </label>
              </div>

              {editingProduct && discountForm.discountPercent > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Preview:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 line-through">
                      {formatPrice(editingProduct.price, editingProduct.currency)}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(
                        editingProduct.price *
                          (1 - discountForm.discountPercent / 100),
                        editingProduct.currency
                      )}
                    </span>
                    <span className="text-red-600 font-semibold">
                      (-{discountForm.discountPercent}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetDiscount}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
