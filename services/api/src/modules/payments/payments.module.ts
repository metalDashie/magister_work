import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { Payment } from '../../database/entities'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { OrdersModule } from '../orders/orders.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), HttpModule, OrdersModule, EmailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
