import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, LessThan, MoreThanOrEqual } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  AnalyticsSnapshot,
  SnapshotType,
  Order,
  OrderItem,
  Product,
  User,
  Cart,
  Review,
  ReturnRequest,
} from '../../database/entities'
import { OrderStatus } from '@fullmag/common'

@Injectable()
export class AnalyticsAggregationService {
  private readonly logger = new Logger(AnalyticsAggregationService.name)

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private snapshotRepo: Repository<AnalyticsSnapshot>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ReturnRequest)
    private returnRepo: Repository<ReturnRequest>,
  ) {}

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailySnapshot() {
    this.logger.log('Generating daily analytics snapshot...')

    // Generate snapshot for yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    try {
      await this.createSnapshot(yesterday, SnapshotType.DAILY)
      this.logger.log(`Daily snapshot created for ${yesterday.toISOString().split('T')[0]}`)
    } catch (error) {
      this.logger.error('Failed to generate daily snapshot:', error)
    }
  }

  // Run every Monday at 1 AM
  @Cron('0 1 * * 1')
  async generateWeeklySnapshot() {
    this.logger.log('Generating weekly analytics snapshot...')

    const lastWeekStart = new Date()
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    lastWeekStart.setHours(0, 0, 0, 0)

    try {
      await this.createSnapshot(lastWeekStart, SnapshotType.WEEKLY)
      this.logger.log(`Weekly snapshot created for week starting ${lastWeekStart.toISOString().split('T')[0]}`)
    } catch (error) {
      this.logger.error('Failed to generate weekly snapshot:', error)
    }
  }

  // Run on 1st of each month at 2 AM
  @Cron('0 2 1 * *')
  async generateMonthlySnapshot() {
    this.logger.log('Generating monthly analytics snapshot...')

    const lastMonthStart = new Date()
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    lastMonthStart.setDate(1)
    lastMonthStart.setHours(0, 0, 0, 0)

    try {
      await this.createSnapshot(lastMonthStart, SnapshotType.MONTHLY)
      this.logger.log(`Monthly snapshot created for ${lastMonthStart.toISOString().split('T')[0]}`)
    } catch (error) {
      this.logger.error('Failed to generate monthly snapshot:', error)
    }
  }

  async createSnapshot(date: Date, type: SnapshotType): Promise<AnalyticsSnapshot> {
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)

    let endDate: Date
    switch (type) {
      case SnapshotType.DAILY:
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        break
      case SnapshotType.WEEKLY:
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 7)
        break
      case SnapshotType.MONTHLY:
        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        break
    }

    // Check if snapshot already exists
    const existing = await this.snapshotRepo.findOne({
      where: { snapshotDate: startDate, type },
    })

    if (existing) {
      this.logger.log(`Snapshot already exists for ${startDate.toISOString().split('T')[0]} (${type})`)
      return existing
    }

    // Gather all metrics
    const [
      orderMetrics,
      customerMetrics,
      productMetrics,
      cartMetrics,
      reviewMetrics,
      returnMetrics,
      topProducts,
      topCategories,
      revenueByPaymentMethod,
      ordersByStatus,
      revenueByHour,
    ] = await Promise.all([
      this.getOrderMetrics(startDate, endDate),
      this.getCustomerMetrics(startDate, endDate),
      this.getProductMetrics(),
      this.getCartMetrics(startDate, endDate),
      this.getReviewMetrics(startDate, endDate),
      this.getReturnMetrics(startDate, endDate),
      this.getTopProducts(startDate, endDate),
      this.getTopCategories(startDate, endDate),
      this.getRevenueByPaymentMethod(startDate, endDate),
      this.getOrdersByStatus(startDate, endDate),
      this.getRevenueByHour(startDate, endDate),
    ])

    const snapshot = this.snapshotRepo.create({
      snapshotDate: startDate,
      type,
      ...orderMetrics,
      ...customerMetrics,
      ...productMetrics,
      ...cartMetrics,
      ...reviewMetrics,
      ...returnMetrics,
      topProducts,
      topCategories,
      revenueByPaymentMethod,
      ordersByStatus,
      revenueByHour,
    })

    return this.snapshotRepo.save(snapshot)
  }

  private async getOrderMetrics(startDate: Date, endDate: Date) {
    const orders = await this.orderRepo.find({
      where: { createdAt: Between(startDate, endDate) },
    })

    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED)
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED)
    const pendingOrders = orders.filter(o =>
      o.status === OrderStatus.PENDING ||
      o.status === OrderStatus.PAID ||
      o.status === OrderStatus.PROCESSING
    )

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const averageOrderValue = completedOrders.length > 0
      ? totalRevenue / completedOrders.length
      : 0

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      pendingOrders: pendingOrders.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    }
  }

  private async getCustomerMetrics(startDate: Date, endDate: Date) {
    const totalCustomers = await this.userRepo.count()

    const newCustomers = await this.userRepo.count({
      where: { createdAt: Between(startDate, endDate) },
    })

    // Returning customers = users with more than 1 order in period
    const customersWithOrders = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.userId')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('order.userId')
      .having('COUNT(order.id) > 1')
      .getRawMany()

    return {
      totalCustomers,
      newCustomers,
      returningCustomers: customersWithOrders.length,
    }
  }

  private async getProductMetrics() {
    const products = await this.productRepo.find()

    const totalProducts = products.length
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length
    const outOfStockProducts = products.filter(p => p.stock === 0).length
    const inventoryValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0)

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
    }
  }

  private async getCartMetrics(startDate: Date, endDate: Date) {
    // Abandoned carts = carts with items, updated in period, but no corresponding order
    const abandonedCarts = await this.cartRepo
      .createQueryBuilder('cart')
      .innerJoin('cart.items', 'items')
      .leftJoin('orders', 'order', 'order.userId = cart.userId AND order.createdAt > cart.updatedAt')
      .where('cart.updatedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.id IS NULL')
      .getCount()

    // Calculate conversion rate
    const totalCartsWithItems = await this.cartRepo
      .createQueryBuilder('cart')
      .innerJoin('cart.items', 'items')
      .where('cart.updatedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount()

    const ordersFromCarts = await this.orderRepo.count({
      where: { createdAt: Between(startDate, endDate) },
    })

    const cartConversionRate = totalCartsWithItems > 0
      ? (ordersFromCarts / totalCartsWithItems) * 100
      : 0

    return {
      abandonedCarts,
      cartConversionRate: Math.round(cartConversionRate * 100) / 100,
    }
  }

  private async getReviewMetrics(startDate: Date, endDate: Date) {
    const newReviews = await this.reviewRepo.count({
      where: { createdAt: Between(startDate, endDate) },
    })

    const avgRatingResult = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .where('review.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne()

    return {
      newReviews,
      averageRating: avgRatingResult?.avgRating
        ? Math.round(Number(avgRatingResult.avgRating) * 100) / 100
        : null,
    }
  }

  private async getReturnMetrics(startDate: Date, endDate: Date) {
    const returnRequests = await this.returnRepo.count({
      where: { createdAt: Between(startDate, endDate) },
    })

    const totalOrders = await this.orderRepo.count({
      where: { createdAt: Between(startDate, endDate) },
    })

    const returnRate = totalOrders > 0 ? (returnRequests / totalOrders) * 100 : 0

    return {
      returnRequests,
      returnRate: Math.round(returnRate * 100) / 100,
    }
  }

  private async getTopProducts(startDate: Date, endDate: Date) {
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .select('item.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'quantitySold')
      .addSelect('SUM(CAST(item.price AS DECIMAL) * item.quantity)', 'revenue')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('item.productId')
      .addGroupBy('product.name')
      .orderBy('quantitySold', 'DESC')
      .limit(10)
      .getRawMany()

    return result.map(r => ({
      productId: r.productId,
      productName: r.productName || 'Unknown',
      quantitySold: Number(r.quantitySold),
      revenue: Math.round(Number(r.revenue) * 100) / 100,
    }))
  }

  private async getTopCategories(startDate: Date, endDate: Date) {
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('SUM(CAST(item.price AS DECIMAL) * item.quantity)', 'revenue')
      .addSelect('COUNT(DISTINCT item.orderId)', 'orderCount')
      .leftJoin('item.product', 'product')
      .leftJoin('product.category', 'category')
      .leftJoin('item.order', 'order')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('revenue', 'DESC')
      .limit(10)
      .getRawMany()

    return result.map(r => ({
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName || 'Uncategorized',
      revenue: Math.round(Number(r.revenue || 0) * 100) / 100,
      orderCount: Number(r.orderCount),
    }))
  }

  private async getRevenueByPaymentMethod(startDate: Date, endDate: Date) {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.paymentMethod', 'paymentMethod')
      .addSelect('SUM(CAST(order.totalAmount AS DECIMAL))', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('order.paymentMethod')
      .getRawMany()

    const byMethod: Record<string, number> = {}
    result.forEach(r => {
      byMethod[r.paymentMethod] = Math.round(Number(r.revenue || 0) * 100) / 100
    })

    return byMethod
  }

  private async getOrdersByStatus(startDate: Date, endDate: Date) {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('order.status')
      .getRawMany()

    const byStatus: Record<string, number> = {}
    result.forEach(r => {
      byStatus[r.status] = Number(r.count)
    })

    return byStatus
  }

  private async getRevenueByHour(startDate: Date, endDate: Date) {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select("EXTRACT(HOUR FROM order.createdAt)", 'hour')
      .addSelect('SUM(CAST(order.totalAmount AS DECIMAL))', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany()

    const byHour: Record<string, number> = {}
    result.forEach(r => {
      byHour[`${r.hour}:00`] = Math.round(Number(r.revenue || 0) * 100) / 100
    })

    return byHour
  }

  // Manual trigger to backfill historical data
  async backfillSnapshots(days: number = 30) {
    this.logger.log(`Backfilling snapshots for last ${days} days...`)

    for (let i = days; i >= 1; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      try {
        await this.createSnapshot(date, SnapshotType.DAILY)
        this.logger.log(`Created snapshot for ${date.toISOString().split('T')[0]}`)
      } catch (error) {
        this.logger.error(`Failed to create snapshot for ${date.toISOString().split('T')[0]}:`, error)
      }
    }

    this.logger.log('Backfill complete')
  }

  // Get snapshots for a date range
  async getSnapshots(
    startDate: Date,
    endDate: Date,
    type: SnapshotType = SnapshotType.DAILY
  ): Promise<AnalyticsSnapshot[]> {
    return this.snapshotRepo.find({
      where: {
        snapshotDate: Between(startDate, endDate),
        type,
      },
      order: { snapshotDate: 'ASC' },
    })
  }

  // Get latest snapshot
  async getLatestSnapshot(type: SnapshotType = SnapshotType.DAILY): Promise<AnalyticsSnapshot | null> {
    return this.snapshotRepo.findOne({
      where: { type },
      order: { snapshotDate: 'DESC' },
    })
  }

  // Get comparison between two periods
  async getComparison(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ) {
    const [currentSnapshots, previousSnapshots] = await Promise.all([
      this.getSnapshots(currentStart, currentEnd),
      this.getSnapshots(previousStart, previousEnd),
    ])

    const sumMetrics = (snapshots: AnalyticsSnapshot[]) => ({
      totalRevenue: snapshots.reduce((sum, s) => sum + Number(s.totalRevenue), 0),
      totalOrders: snapshots.reduce((sum, s) => sum + s.totalOrders, 0),
      completedOrders: snapshots.reduce((sum, s) => sum + s.completedOrders, 0),
      newCustomers: snapshots.reduce((sum, s) => sum + s.newCustomers, 0),
      productsSold: snapshots.reduce((sum, s) => sum + s.productsSold, 0),
      newReviews: snapshots.reduce((sum, s) => sum + s.newReviews, 0),
      returnRequests: snapshots.reduce((sum, s) => sum + s.returnRequests, 0),
    })

    const current = sumMetrics(currentSnapshots)
    const previous = sumMetrics(previousSnapshots)

    const calculateGrowth = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100 * 100) / 100 : 0

    return {
      current,
      previous,
      growth: {
        revenue: calculateGrowth(current.totalRevenue, previous.totalRevenue),
        orders: calculateGrowth(current.totalOrders, previous.totalOrders),
        customers: calculateGrowth(current.newCustomers, previous.newCustomers),
        productsSold: calculateGrowth(current.productsSold, previous.productsSold),
      },
    }
  }
}
