import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'
import { CouponsService, CreateCouponDto } from './coupons.service'
import { CouponType } from '../../database/entities'

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ==================== PUBLIC ====================

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(
    @Request() req,
    @Body() body: { code: string; orderAmount: number },
  ) {
    return this.couponsService.validateCoupon(
      body.code,
      req.user.id,
      body.orderAmount,
    )
  }

  // ==================== ADMIN ====================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll() {
    return this.couponsService.findAll()
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats() {
    return this.couponsService.getStats()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Request() req, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto, req.user.id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCouponDto>) {
    return this.couponsService.update(id, dto)
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async toggleStatus(@Param('id') id: string) {
    return this.couponsService.toggleStatus(id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.couponsService.delete(id)
  }
}
