import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Category } from '../../database/entities'

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query('flat') flat?: string) {
    if (flat === 'true') {
      return this.categoriesService.findAllFlat()
    }
    return this.categoriesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCategoryDto: Partial<Category>) {
    return this.categoriesService.create(createCategoryDto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: Partial<Category>,
  ) {
    return this.categoriesService.update(id, updateCategoryDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id)
  }
}
