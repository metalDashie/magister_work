import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Wishlist, Product } from '../../database/entities'
import { WishlistService } from './wishlist.service'
import { WishlistController } from './wishlist.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product])],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
