import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReviewsService } from './reviews.service'
import { ReviewsController } from './reviews.controller'
import {
  Review,
  ReviewLike,
  ReviewReply,
  ReviewComplaint,
  Product,
  Order,
} from '../../database/entities'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review,
      ReviewLike,
      ReviewReply,
      ReviewComplaint,
      Product,
      Order,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
