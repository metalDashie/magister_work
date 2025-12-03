'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Pagination from '@/components/common/Pagination'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Product {
  id: string
  name: string
  sku?: string
  price: number
  currency: string
  stock: number
  category?: {
    id: number
    name: string
  }
}

interface ProductStats {
  totalProducts: number
  totalValue: number
  avgPrice: number
  inStock: number
  lowStock: number
  outOfStock: number
  byCategory: { name: string; count: number; value: number }[]
  priceRanges: { range: string; count: number }[]
}

const PIE_COLORS = [
  '#22C55E',
  '#EAB308',
  '#EF4444',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
]

export default function AdminProductsPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    productId: string | null
    productName: string
  }>({
    isOpen: false,
    productId: null,
    productName: '',
  })
  const [showCharts, setShowCharts] = useState(true)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      console.log('[REDIRECT] admin/products/page.tsx -> /auth/login', {
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

    loadProducts()
    loadAllProductsForStats()
  }, [_hasHydrated, isAuthenticated, user, router, page, searchQuery])

  const loadAllProductsForStats = async () => {
    try {
      setStatsLoading(true)
      const response = await api.get('/products', {
        params: { limit: 1000 },
      })
      setAllProducts(response.data.data || [])
    } catch (error) {
      console.error('Failed to load products for stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

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

  const handleDeleteClick = (product: Product) => {
    setConfirmModal({
      isOpen: true,
      productId: product.id,
      productName: product.name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!confirmModal.productId) return

    try {
      await api.delete(`/products/${confirmModal.productId}`)
      loadProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  // Calculate statistics from all products
  const calculateStats = (): ProductStats => {
    const totalProducts = allProducts.length
    const totalValue = allProducts.reduce(
      (sum, p) => sum + p.price * p.stock,
      0
    )
    const avgPrice =
      totalProducts > 0
        ? allProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts
        : 0
    const inStock = allProducts.filter((p) => p.stock > 10).length
    const lowStock = allProducts.filter(
      (p) => p.stock > 0 && p.stock <= 10
    ).length
    const outOfStock = allProducts.filter((p) => p.stock === 0).length

    // Group by category
    const categoryMap = new Map<string, { count: number; value: number }>()
    allProducts.forEach((p) => {
      const catName = p.category?.name || 'Uncategorized'
      const existing = categoryMap.get(catName) || { count: 0, value: 0 }
      existing.count++
      existing.value += p.price * p.stock
      categoryMap.set(catName, existing)
    })
    const byCategory = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, count: data.count, value: data.value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Price ranges
    const priceRanges = [
      {
        range: '0-500',
        count: allProducts.filter((p) => p.price <= 500).length,
      },
      {
        range: '500-1000',
        count: allProducts.filter((p) => p.price > 500 && p.price <= 1000)
          .length,
      },
      {
        range: '1000-5000',
        count: allProducts.filter((p) => p.price > 1000 && p.price <= 5000)
          .length,
      },
      {
        range: '5000-10000',
        count: allProducts.filter((p) => p.price > 5000 && p.price <= 10000)
          .length,
      },
      {
        range: '10000+',
        count: allProducts.filter((p) => p.price > 10000).length,
      },
    ].filter((r) => r.count > 0)

    return {
      totalProducts,
      totalValue,
      avgPrice,
      inStock,
      lowStock,
      outOfStock,
      byCategory,
      priceRanges,
    }
  }

  const stats = calculateStats()

  const stockStatusData = [
    { name: 'In Stock', value: stats.inStock, color: '#22C55E' },
    { name: 'Low Stock', value: stats.lowStock, color: '#EAB308' },
    { name: 'Out of Stock', value: stats.outOfStock, color: '#EF4444' },
  ].filter((d) => d.value > 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(amount)
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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your product catalog and inventory
          </p>
        </div>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className={`px-4 py-2 rounded ${showCharts ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Inventory Value</div>
          <div className="text-xl font-bold text-primary-600">
            {formatCurrency(stats.totalValue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Avg Price</div>
          <div className="text-xl font-bold">
            {formatCurrency(stats.avgPrice)}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-700">In Stock</div>
          <div className="text-2xl font-bold text-green-700">
            {stats.inStock}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-700">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-700">
            {stats.lowStock}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-700">Out of Stock</div>
          <div className="text-2xl font-bold text-red-700">
            {stats.outOfStock}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && !statsLoading && allProducts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stock Status Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Stock Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Products by Category */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  fontSize={12}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Price Range Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Price Range Distribution (UAH)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.priceRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Inventory Value */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Inventory Value by Category
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byCategory.filter((c) => c.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats.byCategory.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
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
          <Link
            href="/admin/products/import"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Import CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
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
            Add Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No products found.{' '}
                    <Link
                      href="/admin/products/new"
                      className="text-primary-600 hover:underline"
                    >
                      Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {product.sku || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {product.category?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.price, product.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.stock > 10
                            ? 'bg-green-100 text-green-800'
                            : product.stock > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(product)}
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

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={20}
          onPageChange={setPage}
          showPageNumbers={true}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, productId: null, productName: '' })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmModal.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
