import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { Payment, Order } from '../../database/entities'

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
