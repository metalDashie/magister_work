import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WishlistService } from './wishlist.service'

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Request() req) {
    const items = await this.wishlistService.getWishlist(req.user.userId)
    return { items, count: items.length }
  }

  @Get('count')
  async getCount(@Request() req) {
    const count = await this.wishlistService.getWishlistCount(req.user.userId)
    return { count }
  }

  @Get('check/:productId')
  async checkInWishlist(@Request() req, @Param('productId') productId: string) {
    const inWishlist = await this.wishlistService.isInWishlist(req.user.userId, productId)
    return { inWishlist }
  }

  @Post(':productId')
  async addToWishlist(@Request() req, @Param('productId') productId: string) {
    const item = await this.wishlistService.addToWishlist(req.user.userId, productId)
    return { success: true, item }
  }

  @Post(':productId/toggle')
  async toggleWishlist(@Request() req, @Param('productId') productId: string) {
    const result = await this.wishlistService.toggleWishlist(req.user.userId, productId)
    return { success: true, ...result }
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromWishlist(@Request() req, @Param('productId') productId: string) {
    await this.wishlistService.removeFromWishlist(req.user.userId, productId)
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearWishlist(@Request() req) {
    await this.wishlistService.clearWishlist(req.user.userId)
  }
}
