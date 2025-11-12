import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { Payment } from '../../database/entities'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), HttpModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
