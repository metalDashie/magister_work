import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { CartService } from './cart.service'
import { AddToCartDto } from '@fullmag/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId)
  }

  @Post('items')
  addItem(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(req.user.userId, addToCartDto)
  }

  @Put('items/:id')
  updateItem(
    @Request() req,
    @Param('id') itemId: string,
    @Body() updateDto: { quantity: number }
  ) {
    return this.cartService.updateItemQuantity(
      req.user.userId,
      itemId,
      updateDto.quantity
    )
  }

  @Delete('items/:id')
  removeItem(@Request() req, @Param('id') itemId: string) {
    return this.cartService.removeItem(req.user.userId, itemId)
  }

  @Delete('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId)
  }
}
