import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}
