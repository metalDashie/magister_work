'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsSummary {
  period: string
  totals: {
    totalRevenue: number
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    newCustomers: number
    newReviews: number
    returnRequests: number
  }
  averages: {
    dailyRevenue: number
    dailyOrders: number
    orderValue: number
  }
  currentState: {
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    inventoryValue: number
    totalCustomers: number
  }
  topProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  topCategories: Array<{
    categoryId: number
    categoryName: string
    revenue: number
    orderCount: number
  }>
  dailyData: Array<{
    date: string
    revenue: number
    orders: number
    customers: number
  }>
}

interface Comparison {
  current: {
    totalRevenue: number
    totalOrders: number
    newCustomers: number
  }
  previous: {
    totalRevenue: number
    totalOrders: number
    newCustomers: number
  }
  growth: {
    revenue: number
    orders: number
    customers: number
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week')
  const [backfilling, setBackfilling] = useState(false)
  const [generating, setGenerating] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, authLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, period])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [summaryRes, comparisonRes] = await Promise.all([
        api.get(`/analytics/summary?period=${period}`),
        api.get(`/analytics/comparison?period=${period}`),
      ])
      setSummary(summaryRes.data)
      setComparison(comparisonRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackfill = async () => {
    if (!confirm('This will generate snapshots for the last 30 days. Continue?')) return

    try {
      setBackfilling(true)
      await api.post('/analytics/snapshots/backfill?days=30')
      alert('Backfill started. Data will be available shortly.')
      setTimeout(fetchData, 3000)
    } catch (error) {
      console.error('Backfill failed:', error)
      alert('Backfill failed')
    } finally {
      setBackfilling(false)
    }
  }

  const handleGenerateToday = async () => {
    try {
      setGenerating(true)
      await api.post('/analytics/snapshots/generate')
      alert('Snapshot generated successfully')
      fetchData()
    } catch (error) {
      console.error('Generate failed:', error)
      alert('Generate failed')
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount)
  }

  const formatGrowth = (value: number) => {
    const prefix = value > 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  // Check if we have snapshot data
  const hasData = summary && summary.dailyData && summary.dailyData.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Pre-calculated metrics from daily snapshots</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'quarter')}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <button
            onClick={handleGenerateToday}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Today'}
          </button>
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {backfilling ? 'Backfilling...' : 'Backfill 30 Days'}
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Snapshot Data Available</h2>
          <p className="text-yellow-700 mb-4">
            Click "Backfill 30 Days" to generate historical analytics data, or "Generate Today" for today's snapshot.
          </p>
          <p className="text-sm text-yellow-600">
            Snapshots are automatically generated daily at midnight.
          </p>
        </div>
      ) : (
        <>
          {/* Growth Comparison Cards */}
          {comparison && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">Revenue vs Previous Period</div>
                <div className="text-2xl font-bold">{formatCurrency(comparison.current.totalRevenue)}</div>
                <div className={`text-sm font-medium ${comparison.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(comparison.growth.revenue)} from previous period
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">Orders vs Previous Period</div>
                <div className="text-2xl font-bold">{comparison.current.totalOrders}</div>
                <div className={`text-sm font-medium ${comparison.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(comparison.growth.orders)} from previous period
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">New Customers vs Previous</div>
                <div className="text-2xl font-bold">{comparison.current.newCustomers}</div>
                <div className={`text-sm font-medium ${comparison.growth.customers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(comparison.growth.customers)} from previous period
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-xl font-bold text-primary-600">{formatCurrency(summary!.totals.totalRevenue)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-xl font-bold">{summary!.totals.totalOrders}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xl font-bold text-green-600">{summary!.totals.completedOrders}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Avg Order Value</div>
              <div className="text-xl font-bold">{formatCurrency(summary!.averages.orderValue)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">New Customers</div>
              <div className="text-xl font-bold text-blue-600">{summary!.totals.newCustomers}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">New Reviews</div>
              <div className="text-xl font-bold">{summary!.totals.newReviews}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={summary!.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#93C5FD" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Trend */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Orders & Customers Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary!.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#22C55E" strokeWidth={2} name="Orders" />
                  <Line type="monotone" dataKey="customers" stroke="#8B5CF6" strokeWidth={2} name="New Customers" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Products */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              {summary!.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {summary!.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium truncate max-w-[200px]">{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                        <div className="text-xs text-gray-500">{product.quantitySold} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No sales data available</p>
              )}
            </div>

            {/* Top Categories */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
              {summary!.topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary!.topCategories.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="categoryName" type="category" width={100} fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No category data available</p>
              )}
            </div>
          </div>

          {/* Current Inventory State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Current Inventory State</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{summary!.currentState.totalProducts}</div>
                <div className="text-sm text-gray-500">Total Products</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summary!.currentState.totalProducts - summary!.currentState.lowStockProducts - summary!.currentState.outOfStockProducts}
                </div>
                <div className="text-sm text-green-600">In Stock</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{summary!.currentState.lowStockProducts}</div>
                <div className="text-sm text-yellow-600">Low Stock</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary!.currentState.outOfStockProducts}</div>
                <div className="text-sm text-red-600">Out of Stock</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{formatCurrency(summary!.currentState.inventoryValue)}</div>
                <div className="text-sm text-blue-600">Inventory Value</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
