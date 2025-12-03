import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

export enum SnapshotType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('analytics_snapshots')
@Index(['snapshotDate', 'type'], { unique: true })
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date

  @Column({
    type: 'enum',
    enum: SnapshotType,
    default: SnapshotType.DAILY,
  })
  type: SnapshotType

  // Revenue Metrics
  @Column({ name: 'total_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number

  @Column({ name: 'total_orders', type: 'int', default: 0 })
  totalOrders: number

  @Column({ name: 'completed_orders', type: 'int', default: 0 })
  completedOrders: number

  @Column({ name: 'cancelled_orders', type: 'int', default: 0 })
  cancelledOrders: number

  @Column({ name: 'pending_orders', type: 'int', default: 0 })
  pendingOrders: number

  @Column({ name: 'average_order_value', type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageOrderValue: number

  // Customer Metrics
  @Column({ name: 'new_customers', type: 'int', default: 0 })
  newCustomers: number

  @Column({ name: 'returning_customers', type: 'int', default: 0 })
  returningCustomers: number

  @Column({ name: 'total_customers', type: 'int', default: 0 })
  totalCustomers: number

  // Product Metrics
  @Column({ name: 'total_products', type: 'int', default: 0 })
  totalProducts: number

  @Column({ name: 'products_sold', type: 'int', default: 0 })
  productsSold: number

  @Column({ name: 'low_stock_products', type: 'int', default: 0 })
  lowStockProducts: number

  @Column({ name: 'out_of_stock_products', type: 'int', default: 0 })
  outOfStockProducts: number

  @Column({ name: 'inventory_value', type: 'decimal', precision: 12, scale: 2, default: 0 })
  inventoryValue: number

  // Cart Metrics
  @Column({ name: 'abandoned_carts', type: 'int', default: 0 })
  abandonedCarts: number

  @Column({ name: 'cart_conversion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cartConversionRate: number

  // Review Metrics
  @Column({ name: 'new_reviews', type: 'int', default: 0 })
  newReviews: number

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating: number | null

  // Return Metrics
  @Column({ name: 'return_requests', type: 'int', default: 0 })
  returnRequests: number

  @Column({ name: 'return_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  returnRate: number

  // Top performers (stored as JSON)
  @Column({ name: 'top_products', type: 'jsonb', nullable: true })
  topProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }> | null

  @Column({ name: 'top_categories', type: 'jsonb', nullable: true })
  topCategories: Array<{
    categoryId: number
    categoryName: string
    revenue: number
    orderCount: number
  }> | null

  @Column({ name: 'revenue_by_payment_method', type: 'jsonb', nullable: true })
  revenueByPaymentMethod: Record<string, number> | null

  @Column({ name: 'orders_by_status', type: 'jsonb', nullable: true })
  ordersByStatus: Record<string, number> | null

  @Column({ name: 'revenue_by_hour', type: 'jsonb', nullable: true })
  revenueByHour: Record<string, number> | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
