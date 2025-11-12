import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order, OrderItem } from '../../database/entities'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { CartModule } from '../cart/cart.module'

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
