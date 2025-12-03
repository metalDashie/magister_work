import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AbandonedCartService } from './abandoned-cart.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'

@Controller('abandoned-carts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AbandonedCartController {
  constructor(private abandonedCartService: AbandonedCartService) {}

  @Get('stats')
  async getStats() {
    return this.abandonedCartService.getStats()
  }

  @Get()
  async getAbandonedCarts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.abandonedCartService.getAbandonedCarts(
      parseInt(page, 10),
      parseInt(limit, 10)
    )
  }

  @Post(':id/remind')
  async sendReminder(@Param('id') id: string) {
    const success = await this.abandonedCartService.sendManualReminder(id)
    return { success }
  }

  @Post('process')
  async triggerProcessing() {
    await this.abandonedCartService.handleAbandonedCarts()
    return { success: true, message: 'Abandoned cart processing triggered' }
  }
}
