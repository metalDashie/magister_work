import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order, OrderItem } from '../../database/entities'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { CartModule } from '../cart/cart.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), CartModule, EmailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
