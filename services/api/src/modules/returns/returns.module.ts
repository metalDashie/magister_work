import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReturnRequest, Order, OrderItem } from '../../database/entities'
import { ReturnsService } from './returns.service'
import { ReturnsController } from './returns.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ReturnRequest, Order, OrderItem])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
