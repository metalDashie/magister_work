import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, MoreThan, LessThan } from 'typeorm'
import { Order, OrderItem, Product, User, Payment } from '../../database/entities'
import { OrderStatus, PaymentStatus } from '@fullmag/common'

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface SalesMetrics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalProducts: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  conversionRate: number
  revenueGrowth: number
  orderGrowth: number
}

export interface CustomerMetrics {
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

export interface ProductMetrics {
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

export interface InventoryMetrics {
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
  stockByCategory: Array<{
    categoryId: number
    categoryName: string
    totalStock: number
    stockValue: number
  }>
}

export interface RevenueByPeriod {
  date: string
  revenue: number
  orders: number
}

export interface OrdersByStatus {
  status: OrderStatus
  count: number
  totalValue: number
}

export interface DashboardOverview {
  sales: SalesMetrics
  customers: CustomerMetrics
  products: ProductMetrics
  inventory: InventoryMetrics
  revenueChart: RevenueByPeriod[]
  ordersByStatus: OrdersByStatus[]
  recentOrders: any[]
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(dateRange?: DateRange): Promise<DashboardOverview> {
    const range = dateRange || this.getDefaultDateRange()

    const [sales, customers, products, inventory, revenueChart, ordersByStatus, recentOrders] =
      await Promise.all([
        this.getSalesMetrics(range),
        this.getCustomerMetrics(range),
        this.getProductMetrics(range),
        this.getInventoryMetrics(),
        this.getRevenueByPeriod(range),
        this.getOrdersByStatus(range),
        this.getRecentOrders(10),
      ])

    return {
      sales,
      customers,
      products,
      inventory,
      revenueChart,
      ordersByStatus,
      recentOrders,
    }
  }

  /**
   * Get sales metrics
   */
  async getSalesMetrics(dateRange: DateRange): Promise<SalesMetrics> {
    const { startDate, endDate } = dateRange

    // Get orders in current period
    const orders = await this.orderRepo.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['items', 'payment'],
    })

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = startDate

    const previousOrders = await this.orderRepo.find({
      where: {
        createdAt: Between(previousStartDate, previousEndDate),
      },
    })

    // Calculate metrics
    const completedOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED)
    const pendingOrders = orders.filter(
      (o) =>
        o.status === OrderStatus.PENDING ||
        o.status === OrderStatus.PAID ||
        o.status === OrderStatus.PROCESSING,
    )
    const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED)

    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount || 0)
    }, 0)

    const previousRevenue = previousOrders.reduce((sum, order) => {
      if (order.status === OrderStatus.DELIVERED) {
        return sum + Number(order.totalAmount || 0)
      }
      return sum
    }, 0)

    const totalOrders = orders.length
    const previousTotalOrders = previousOrders.length

    const averageOrderValue = totalOrders > 0 ? totalRevenue / completedOrders.length : 0

    // Calculate growth rates
    const revenueGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    const orderGrowth =
      previousTotalOrders > 0
        ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
        : 0

    // Get total products count
    const totalProducts = await this.productRepo.count()

    // Simple conversion rate (orders / total visitors - you'd need to track page views)
    const conversionRate = 0 // Placeholder - implement visitor tracking

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalProducts,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      conversionRate,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      orderGrowth: Math.round(orderGrowth * 100) / 100,
    }
  }

  /**
   * Get customer metrics
   */
  async getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
    const { startDate, endDate } = dateRange

    // Total customers
    const totalCustomers = await this.userRepo.count()

    // New customers in period
    const newCustomers = await this.userRepo.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    })

    // Get all customers with orders
    const customersWithOrders = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('SUM(CAST(order.totalAmount AS DECIMAL))', 'totalSpent')
      .leftJoin('order.user', 'user')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('order.userId')
      .addGroupBy('user.email')
      .getRawMany()

    // Returning customers (more than 1 order)
    const returningCustomers = customersWithOrders.filter((c) => Number(c.orderCount) > 1).length

    // Customer retention rate
    const customerRetentionRate =
      totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0

    // Average CLV
    const totalSpent = customersWithOrders.reduce(
      (sum, c) => sum + Number(c.totalSpent || 0),
      0,
    )
    const averageCustomerLifetimeValue =
      customersWithOrders.length > 0 ? totalSpent / customersWithOrders.length : 0

    // Top customers
    const topCustomers = customersWithOrders
      .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
      .slice(0, 10)
      .map((c) => ({
        userId: c.userId,
        email: c.email,
        totalSpent: Math.round(Number(c.totalSpent) * 100) / 100,
        orderCount: Number(c.orderCount),
      }))

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
      averageCustomerLifetimeValue: Math.round(averageCustomerLifetimeValue * 100) / 100,
      topCustomers,
    }
  }

  /**
   * Get product metrics
   */
  async getProductMetrics(dateRange: DateRange): Promise<ProductMetrics> {
    const { startDate, endDate } = dateRange

    // Total products
    const totalProducts = await this.productRepo.count()

    // Low stock products (stock < 10)
    const lowStockProducts = await this.productRepo.count({
      where: {
        stock: LessThan(10),
      },
    })

    // Out of stock
    const outOfStockProducts = await this.productRepo.count({
      where: {
        stock: 0,
      },
    })

    // Top selling products
    const topSellingData = await this.orderItemRepo
      .createQueryBuilder('orderItem')
      .select('orderItem.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'quantitySold')
      .addSelect('SUM(CAST(orderItem.price AS DECIMAL) * orderItem.quantity)', 'revenue')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('orderItem.productId')
      .addGroupBy('product.name')
      .orderBy('quantitySold', 'DESC')
      .limit(10)
      .getRawMany()

    const topSellingProducts = topSellingData.map((p) => ({
      productId: p.productId,
      productName: p.productName || 'Unknown',
      quantitySold: Number(p.quantitySold),
      revenue: Math.round(Number(p.revenue) * 100) / 100,
    }))

    // Category performance
    const categoryData = await this.orderItemRepo
      .createQueryBuilder('orderItem')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(DISTINCT orderItem.orderId)', 'orderCount')
      .addSelect('COUNT(DISTINCT product.id)', 'productCount')
      .addSelect('SUM(CAST(orderItem.price AS DECIMAL) * orderItem.quantity)', 'revenue')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('product.category', 'category')
      .leftJoin('orderItem.order', 'order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('revenue', 'DESC')
      .getRawMany()

    const categoryPerformance = categoryData.map((c) => ({
      categoryId: Number(c.categoryId),
      categoryName: c.categoryName || 'Uncategorized',
      revenue: Math.round(Number(c.revenue || 0) * 100) / 100,
      productCount: Number(c.productCount),
      orderCount: Number(c.orderCount),
    }))

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts,
      categoryPerformance,
    }
  }

  /**
   * Get inventory metrics
   */
  async getInventoryMetrics(): Promise<InventoryMetrics> {
    // Get all products with stock info
    const products = await this.productRepo.find({
      relations: ['category'],
    })

    // Total stock value
    const totalStockValue = products.reduce((sum, p) => {
      return sum + Number(p.price) * p.stock
    }, 0)

    // Total stock quantity
    const totalStockQuantity = products.reduce((sum, p) => sum + p.stock, 0)

    // Low stock alerts (stock < 10 and > 0)
    const lowStockAlerts = products
      .filter((p) => p.stock < 10 && p.stock > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.stock,
        sku: p.sku || 'N/A',
      }))
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 20)

    // Out of stock products
    const outOfStockProducts = products
      .filter((p) => p.stock === 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku || 'N/A',
      }))
      .slice(0, 20)

    // Stock by category
    const categoryStockMap = new Map<number, { name: string; stock: number; value: number }>()

    products.forEach((p) => {
      const categoryId = p.categoryId || 0
      const categoryName = p.category?.name || 'Uncategorized'
      const existing = categoryStockMap.get(categoryId) || {
        name: categoryName,
        stock: 0,
        value: 0,
      }

      existing.stock += p.stock
      existing.value += Number(p.price) * p.stock
      categoryStockMap.set(categoryId, existing)
    })

    const stockByCategory = Array.from(categoryStockMap.entries()).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      totalStock: data.stock,
      stockValue: Math.round(data.value * 100) / 100,
    }))

    return {
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      totalStockQuantity,
      lowStockAlerts,
      outOfStockProducts,
      stockByCategory,
    }
  }

  /**
   * Get revenue by period (for charts)
   */
  async getRevenueByPeriod(dateRange: DateRange): Promise<RevenueByPeriod[]> {
    const { startDate, endDate } = dateRange

    // Determine granularity based on date range
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const groupBy = daysDiff <= 31 ? 'day' : daysDiff <= 365 ? 'week' : 'month'

    let dateFormat: string
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD'
        break
      case 'week':
        dateFormat = 'YYYY-"W"WW'
        break
      case 'month':
        dateFormat = 'YYYY-MM'
        break
    }

    const data = await this.orderRepo
      .createQueryBuilder('order')
      .select(`TO_CHAR(order.createdAt, '${dateFormat}')`, 'date')
      .addSelect('SUM(CAST(order.totalAmount AS DECIMAL))', 'revenue')
      .addSelect('COUNT(order.id)', 'orders')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany()

    return data.map((d) => ({
      date: d.date,
      revenue: Math.round(Number(d.revenue || 0) * 100) / 100,
      orders: Number(d.orders),
    }))
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(dateRange: DateRange): Promise<OrdersByStatus[]> {
    const { startDate, endDate } = dateRange

    const data = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(CAST(order.totalAmount AS DECIMAL))', 'totalValue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('order.status')
      .getRawMany()

    return data.map((d) => ({
      status: d.status as OrderStatus,
      count: Number(d.count),
      totalValue: Math.round(Number(d.totalValue || 0) * 100) / 100,
    }))
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 10): Promise<any[]> {
    const orders = await this.orderRepo.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: limit,
    })

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      customerEmail: order.user?.email || 'Guest',
      itemCount: order.items?.length || 0,
      paymentMethod: order.paymentMethod,
    }))
  }

  /**
   * Get default date range (last 30 days)
   */
  private getDefaultDateRange(): DateRange {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    return { startDate, endDate }
  }

  /**
   * Parse date range from query params
   */
  parseDateRange(startDateStr?: string, endDateStr?: string): DateRange {
    let startDate: Date
    let endDate: Date

    if (startDateStr) {
      startDate = new Date(startDateStr)
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    if (endDateStr) {
      endDate = new Date(endDateStr)
    } else {
      endDate = new Date()
    }

    return { startDate, endDate }
  }
}
