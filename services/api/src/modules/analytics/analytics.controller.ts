import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'
import { AnalyticsService } from './analytics.service'
import { AnalyticsAggregationService } from './analytics-aggregation.service'
import { SnapshotType } from '../../database/entities'

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly aggregationService: AnalyticsAggregationService,
  ) {}

  /**
   * Get comprehensive dashboard overview
   * GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('dashboard')
  async getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.analyticsService.parseDateRange(startDate, endDate)
    return this.analyticsService.getDashboardOverview(dateRange)
  }

  /**
   * Get sales metrics only
   * GET /analytics/sales?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('sales')
  async getSalesMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.analyticsService.parseDateRange(startDate, endDate)
    return this.analyticsService.getSalesMetrics(dateRange)
  }

  /**
   * Get customer metrics only
   * GET /analytics/customers?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('customers')
  async getCustomerMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.analyticsService.parseDateRange(startDate, endDate)
    return this.analyticsService.getCustomerMetrics(dateRange)
  }

  /**
   * Get product metrics only
   * GET /analytics/products?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('products')
  async getProductMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.analyticsService.parseDateRange(startDate, endDate)
    return this.analyticsService.getProductMetrics(dateRange)
  }

  /**
   * Get inventory metrics
   * GET /analytics/inventory
   */
  @Get('inventory')
  async getInventoryMetrics() {
    return this.analyticsService.getInventoryMetrics()
  }

  /**
   * Get revenue by period (for charts)
   * GET /analytics/revenue-chart?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('revenue-chart')
  async getRevenueChart(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.analyticsService.parseDateRange(startDate, endDate)
    return this.analyticsService.getRevenueByPeriod(dateRange)
  }

  /**
   * Get orders by status
   * GET /analytics/orders-by-status?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('orders-by-status')
  async getOrdersByStatus(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.analyticsService.parseDateRange(startDate, endDate)
    return this.analyticsService.getOrdersByStatus(dateRange)
  }

  /**
   * Get recent orders
   * GET /analytics/recent-orders?limit=10
   */
  @Get('recent-orders')
  async getRecentOrders(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10
    return this.analyticsService.getRecentOrders(limitNum)
  }

  // ==================== SNAPSHOT-BASED ENDPOINTS ====================

  /**
   * Get historical snapshots
   * GET /analytics/snapshots?startDate=2024-01-01&endDate=2024-01-31&type=daily
   */
  @Get('snapshots')
  async getSnapshots(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    const snapshotType = (type as SnapshotType) || SnapshotType.DAILY

    return this.aggregationService.getSnapshots(start, end, snapshotType)
  }

  /**
   * Get latest snapshot
   * GET /analytics/snapshots/latest?type=daily
   */
  @Get('snapshots/latest')
  async getLatestSnapshot(@Query('type') type?: string) {
    const snapshotType = (type as SnapshotType) || SnapshotType.DAILY
    return this.aggregationService.getLatestSnapshot(snapshotType)
  }

  /**
   * Get period comparison (current vs previous)
   * GET /analytics/comparison?period=week
   */
  @Get('comparison')
  async getComparison(@Query('period') period?: string) {
    const now = new Date()
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date

    switch (period) {
      case 'week':
        currentEnd = now
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousEnd = currentStart
        previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        currentEnd = now
        currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousEnd = currentStart
        previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        currentEnd = now
        currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousEnd = currentStart
        previousStart = new Date(currentStart.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default: // default to week
        currentEnd = now
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousEnd = currentStart
        previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    return this.aggregationService.getComparison(
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    )
  }

  /**
   * Get trend data for charts (from snapshots)
   * GET /analytics/trends?days=30
   */
  @Get('trends')
  async getTrends(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - numDays * 24 * 60 * 60 * 1000)

    const snapshots = await this.aggregationService.getSnapshots(
      startDate,
      endDate,
      SnapshotType.DAILY,
    )

    return {
      labels: snapshots.map(s => s.snapshotDate),
      revenue: snapshots.map(s => Number(s.totalRevenue)),
      orders: snapshots.map(s => s.totalOrders),
      customers: snapshots.map(s => s.newCustomers),
      averageOrderValue: snapshots.map(s => Number(s.averageOrderValue)),
    }
  }

  /**
   * Manually trigger snapshot creation for today
   * POST /analytics/snapshots/generate
   */
  @Post('snapshots/generate')
  @Roles(UserRole.ADMIN)
  async generateSnapshot() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const snapshot = await this.aggregationService.createSnapshot(today, SnapshotType.DAILY)
    return { message: 'Snapshot generated successfully', snapshot }
  }

  /**
   * Backfill historical snapshots
   * POST /analytics/snapshots/backfill?days=30
   */
  @Post('snapshots/backfill')
  @Roles(UserRole.ADMIN)
  async backfillSnapshots(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30
    await this.aggregationService.backfillSnapshots(numDays)
    return { message: `Backfill initiated for ${numDays} days` }
  }

  /**
   * Get summary dashboard using pre-calculated snapshots
   * GET /analytics/summary?period=week
   */
  @Get('summary')
  async getSummary(@Query('period') period?: string) {
    const numDays = period === 'month' ? 30 : period === 'quarter' ? 90 : 7
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - numDays * 24 * 60 * 60 * 1000)

    const snapshots = await this.aggregationService.getSnapshots(
      startDate,
      endDate,
      SnapshotType.DAILY,
    )

    if (snapshots.length === 0) {
      return { message: 'No snapshot data available. Run backfill first.' }
    }

    // Aggregate snapshot data
    const totals = {
      totalRevenue: snapshots.reduce((sum, s) => sum + Number(s.totalRevenue), 0),
      totalOrders: snapshots.reduce((sum, s) => sum + s.totalOrders, 0),
      completedOrders: snapshots.reduce((sum, s) => sum + s.completedOrders, 0),
      cancelledOrders: snapshots.reduce((sum, s) => sum + s.cancelledOrders, 0),
      newCustomers: snapshots.reduce((sum, s) => sum + s.newCustomers, 0),
      newReviews: snapshots.reduce((sum, s) => sum + s.newReviews, 0),
      returnRequests: snapshots.reduce((sum, s) => sum + s.returnRequests, 0),
    }

    // Get latest snapshot for current state metrics
    const latest = snapshots[snapshots.length - 1]

    return {
      period: `Last ${numDays} days`,
      totals,
      averages: {
        dailyRevenue: Math.round((totals.totalRevenue / snapshots.length) * 100) / 100,
        dailyOrders: Math.round((totals.totalOrders / snapshots.length) * 100) / 100,
        orderValue: totals.completedOrders > 0
          ? Math.round((totals.totalRevenue / totals.completedOrders) * 100) / 100
          : 0,
      },
      currentState: {
        totalProducts: latest?.totalProducts || 0,
        lowStockProducts: latest?.lowStockProducts || 0,
        outOfStockProducts: latest?.outOfStockProducts || 0,
        inventoryValue: latest?.inventoryValue || 0,
        totalCustomers: latest?.totalCustomers || 0,
      },
      topProducts: latest?.topProducts || [],
      topCategories: latest?.topCategories || [],
      dailyData: snapshots.map(s => ({
        date: s.snapshotDate,
        revenue: Number(s.totalRevenue),
        orders: s.totalOrders,
        customers: s.newCustomers,
      })),
    }
  }
}
