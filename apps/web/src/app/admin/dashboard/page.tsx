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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DashboardData {
  sales: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalProducts: number
    completedOrders: number
    pendingOrders: number
    cancelledOrders: number
    revenueGrowth: number
    orderGrowth: number
  }
  customers: {
    totalCustomers: number
    newCustomers: number
    returningCustomers: number
    customerRetentionRate: number
    averageCustomerLifetimeValue: number
    topCustomers: Array<{
      userId: string
      email: string
      totalSpent: number
      orderCount: number
    }>
  }
  products: {
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    topSellingProducts: Array<{
      productId: string
      productName: string
      quantitySold: number
      revenue: number
    }>
    categoryPerformance: Array<{
      categoryId: number
      categoryName: string
      revenue: number
      productCount: number
      orderCount: number
    }>
  }
  inventory: {
    totalStockValue: number
    totalStockQuantity: number
    lowStockAlerts: Array<{
      productId: string
      productName: string
      currentStock: number
      sku: string
    }>
    outOfStockProducts: Array<{
      productId: string
      productName: string
      sku: string
    }>
  }
  revenueChart: Array<{
    date: string
    revenue: number
    orders: number
  }>
  ordersByStatus: Array<{
    status: string
    count: number
    totalValue: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: string
    customerEmail: string
    itemCount: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      router.push('/')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const response = await api.get('/analytics/dashboard', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })

      setDashboardData(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading || !dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 rounded ${
              dateRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 rounded ${
              dateRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`px-4 py-2 rounded ${
              dateRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setDateRange('1y')}
            className={`px-4 py-2 rounded ${
              dateRange === '1y'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(dashboardData.sales.totalRevenue)}
          </p>
          <p
            className={`text-sm mt-2 ${
              dashboardData.sales.revenueGrowth >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatPercent(dashboardData.sales.revenueGrowth)} vs previous period
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
          <p className="text-3xl font-bold mt-2">
            {dashboardData.sales.totalOrders}
          </p>
          <p
            className={`text-sm mt-2 ${
              dashboardData.sales.orderGrowth >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatPercent(dashboardData.sales.orderGrowth)} vs previous period
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">
            Average Order Value
          </h3>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(dashboardData.sales.averageOrderValue)}
          </p>
          <p className="text-sm mt-2 text-gray-600">
            {dashboardData.sales.completedOrders} completed
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Customers</h3>
          <p className="text-3xl font-bold mt-2">
            {dashboardData.customers.totalCustomers}
          </p>
          <p className="text-sm mt-2 text-gray-600">
            {dashboardData.customers.newCustomers} new this period
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboardData.revenueChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name="Revenue (UAH)"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#82ca9d"
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders by Status & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ payload }: { payload?: { status: string; count: number } }) => payload ? `${payload.status}: ${payload.count}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {dashboardData.ordersByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Top Categories by Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.products.categoryPerformance.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue (UAH)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Stock Value</h3>
          <p className="text-2xl font-bold mt-2">
            {formatCurrency(dashboardData.inventory.totalStockValue)}
          </p>
          <p className="text-sm mt-2 text-gray-600">
            {dashboardData.inventory.totalStockQuantity} units
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Low Stock Alerts</h3>
          <p className="text-2xl font-bold mt-2 text-yellow-600">
            {dashboardData.inventory.lowStockAlerts.length}
          </p>
          <p className="text-sm mt-2 text-gray-600">
            Products below threshold
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Out of Stock</h3>
          <p className="text-2xl font-bold mt-2 text-red-600">
            {dashboardData.inventory.outOfStockProducts.length}
          </p>
          <p className="text-sm mt-2 text-gray-600">
            Products need restock
          </p>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.products.topSellingProducts.map((product) => (
                <tr key={product.productId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.quantitySold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Top Customers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.customers.topCustomers.map((customer) => (
                <tr key={customer.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.orderCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.customerEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.itemCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {dashboardData.inventory.lowStockAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-800">
            Low Stock Alerts
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase">
                    Current Stock
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-yellow-200">
                {dashboardData.inventory.lowStockAlerts.slice(0, 10).map((alert) => (
                  <tr key={alert.productId}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {alert.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {alert.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 font-semibold">
                        {alert.currentStock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Returning Customers</h3>
          <p className="text-2xl font-bold mt-2">
            {dashboardData.customers.returningCustomers}
          </p>
          <p className="text-sm mt-2 text-gray-600">
            {dashboardData.customers.customerRetentionRate.toFixed(1)}% retention
            rate
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">
            Avg Customer Lifetime Value
          </h3>
          <p className="text-2xl font-bold mt-2">
            {formatCurrency(dashboardData.customers.averageCustomerLifetimeValue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Order Status</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="font-semibold text-green-600">
                {dashboardData.sales.completedOrders}
              </span>{' '}
              Completed
            </p>
            <p className="text-sm">
              <span className="font-semibold text-yellow-600">
                {dashboardData.sales.pendingOrders}
              </span>{' '}
              Pending
            </p>
            <p className="text-sm">
              <span className="font-semibold text-red-600">
                {dashboardData.sales.cancelledOrders}
              </span>{' '}
              Cancelled
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
