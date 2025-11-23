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
} from '@nestjs/common'
import { BannersService, CreateBannerDto, UpdateBannerDto } from './banners.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { BannerStatus, BannerType } from '../../database/entities'
import { UserRole } from '@fullmag/common'

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // Public endpoint - get active banners for display
  @Get('active')
  async getActiveBanners(
    @Query('page') page?: string,
    @Query('type') type?: BannerType,
  ) {
    return this.bannersService.findActive(page, type)
  }

  // Admin endpoints
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(
    @Query('status') status?: BannerStatus,
    @Query('type') type?: BannerType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bannersService.findAll({
      status,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats() {
    return this.bannersService.getStats()
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id)
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto)
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    return this.bannersService.update(id, updateBannerDto)
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BannerStatus,
  ) {
    return this.bannersService.updateStatus(id, status)
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.bannersService.delete(id)
    return { message: 'Banner deleted successfully' }
  }
}
