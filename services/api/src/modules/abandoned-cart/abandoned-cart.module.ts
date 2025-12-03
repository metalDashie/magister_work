import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { Cart, CartReminder, User, Coupon } from '../../database/entities'
import { AbandonedCartService } from './abandoned-cart.service'
import { AbandonedCartController } from './abandoned-cart.controller'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartReminder, User, Coupon]),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
  controllers: [AbandonedCartController],
  providers: [AbandonedCartService],
  exports: [AbandonedCartService],
})
export class AbandonedCartModule {}
