import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
  Header,
} from '@nestjs/common'
import { Response } from 'express'
import { OrdersService } from './orders.service'
import { CreateOrderDto, UserRole, OrderStatus } from '@fullmag/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user.userId)
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAllAdmin() {
    return this.ordersService.findAllAdmin()
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.userId)
  }

  @Get(':id/invoice')
  async getInvoice(@Request() req, @Param('id') id: string) {
    return this.ordersService.generateInvoice(id, req.user.userId, req.user.role)
  }

  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto)
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@Param('id') id: string, @Body() body: { status: OrderStatus }) {
    return this.ordersService.updateStatus(id, body.status)
  }
}
