import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AddressesService, CreateAddressDto } from './addresses.service'

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async findAll(@Request() req) {
    const addresses = await this.addressesService.findAll(req.user.id)
    return { addresses }
  }

  @Get('default')
  async getDefault(@Request() req) {
    const address = await this.addressesService.findDefault(req.user.id)
    return { address }
  }

  @Get('count')
  async getCount(@Request() req) {
    const count = await this.addressesService.getCount(req.user.id)
    return { count }
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.addressesService.findOne(req.user.id, id)
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateAddressDto) {
    const address = await this.addressesService.create(req.user.id, dto)
    return { success: true, address }
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAddressDto>,
  ) {
    const address = await this.addressesService.update(req.user.id, id, dto)
    return { success: true, address }
  }

  @Patch(':id/default')
  async setDefault(@Request() req, @Param('id') id: string) {
    const address = await this.addressesService.setDefault(req.user.id, id)
    return { success: true, address }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Request() req, @Param('id') id: string) {
    await this.addressesService.delete(req.user.id, id)
  }
}
