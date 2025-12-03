import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { CompareService } from './compare.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('compare')
@UseGuards(JwtAuthGuard)
export class CompareController {
  constructor(private compareService: CompareService) {}

  @Get()
  async getCompareList(@Request() req) {
    return this.compareService.getCompareList(req.user.userId)
  }

  @Get('data')
  async getCompareData(@Request() req) {
    return this.compareService.getCompareData(req.user.userId)
  }

  @Post(':productId')
  async addToCompare(@Request() req, @Param('productId') productId: string) {
    return this.compareService.addToCompare(req.user.userId, productId)
  }

  @Post(':productId/toggle')
  async toggleCompare(@Request() req, @Param('productId') productId: string) {
    return this.compareService.toggleCompare(req.user.userId, productId)
  }

  @Delete(':productId')
  async removeFromCompare(
    @Request() req,
    @Param('productId') productId: string
  ) {
    return this.compareService.removeFromCompare(req.user.userId, productId)
  }

  @Delete()
  async clearCompareList(@Request() req) {
    return this.compareService.clearCompareList(req.user.userId)
  }

  @Get(':productId/check')
  async isInCompareList(@Request() req, @Param('productId') productId: string) {
    const inList = await this.compareService.isInCompareList(
      req.user.userId,
      productId
    )
    return { inCompareList: inList }
  }
}
