import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AttributesService } from './attributes.service'
import { Attribute } from '../../database/entities/attribute.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.attributesService.findAll(categoryId)
  }

  @Get('filterable')
  getFilterable(@Query('categoryId') categoryId?: string) {
    return this.attributesService.getFilterableAttributes(categoryId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributesService.findOne(id)
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.attributesService.findBySlug(slug)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAttributeDto: Partial<Attribute>) {
    return this.attributesService.create(createAttributeDto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAttributeDto: Partial<Attribute>) {
    return this.attributesService.update(id, updateAttributeDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.attributesService.remove(id)
  }
}
