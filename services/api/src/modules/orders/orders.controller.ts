import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from '@fullmag/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user.userId)
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.userId)
  }

  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto)
  }
}
