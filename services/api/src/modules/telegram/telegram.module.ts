import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TelegramService } from './telegram.service'
import { TelegramController } from './telegram.controller'
import { TelegramUser } from '../../database/entities/telegram-user.entity'
import { User } from '../../database/entities/user.entity'
import { Cart } from '../../database/entities/cart.entity'
import { Coupon } from '../../database/entities/coupon.entity'
import { Order } from '../../database/entities/order.entity'
import { Product } from '../../database/entities/product.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TelegramUser, User, Cart, Coupon, Order, Product])],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
