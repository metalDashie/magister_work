import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import {
  Order,
  OrderItem,
  Product,
  User,
  Payment,
  Cart,
  Review,
  ReturnRequest,
  AnalyticsSnapshot,
} from '../../database/entities'
import { AnalyticsService } from './analytics.service'
import { AnalyticsAggregationService } from './analytics-aggregation.service'
import { AnalyticsController } from './analytics.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      User,
      Payment,
      Cart,
      Review,
      ReturnRequest,
      AnalyticsSnapshot,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsAggregationService],
  exports: [AnalyticsService, AnalyticsAggregationService],
})
export class AnalyticsModule {}
