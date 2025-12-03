import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'
import { ReturnsService, CreateReturnDto, ProcessReturnDto } from './returns.service'
import { ReturnStatus } from '../../database/entities'

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  // ==================== PUBLIC ====================

  @Get('reasons')
  getReasons() {
    return { reasons: this.returnsService.getReturnReasons() }
  }

  // ==================== USER ====================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyReturns(@Request() req) {
    return this.returnsService.findByUser(req.user.id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReturn(@Request() req, @Body() dto: CreateReturnDto) {
    const returnRequest = await this.returnsService.create(req.user.id, dto)
    return { success: true, returnRequest }
  }

  // ==================== ADMIN ====================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(@Query('status') status?: ReturnStatus) {
    return this.returnsService.findAll(status)
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats() {
    return this.returnsService.getStats()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.returnsService.findOne(id)
  }

  @Put(':id/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async processReturn(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ProcessReturnDto,
  ) {
    const returnRequest = await this.returnsService.process(id, req.user.id, dto)
    return { success: true, returnRequest }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReturnStatus,
  ) {
    const returnRequest = await this.returnsService.updateStatus(id, status)
    return { success: true, returnRequest }
  }
}
