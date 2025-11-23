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
import { ProductsService, SetDiscountDto, BulkDiscountDto } from './products.service'
import { CreateProductDto, UpdateProductDto, UserRole } from '@fullmag/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('attributes') attributes?: string // JSON string of attribute filters
  ) {
    const categoryIdCorrect =
      categoryId === undefined ||
      categoryId === null ||
      Number.isNaN(categoryId)
        ? undefined
        : categoryId
    const minPriceCorrect =
      minPrice === undefined || minPrice === null || Number.isNaN(minPrice)
        ? undefined
        : minPrice
    const maxPriceCorrect =
      maxPrice === undefined || maxPrice === null || Number.isNaN(maxPrice)
        ? undefined
        : maxPrice

    const inStockCorrect =
      inStock !== undefined ? inStock === 'true' : undefined

    return this.productsService.findAll({
      page,
      limit,
      search,
      categoryId: categoryIdCorrect,
      minPrice: minPriceCorrect,
      maxPrice: maxPriceCorrect,
      inStock: inStockCorrect,
      sortBy,
      sortOrder,
      attributes: attributes ? JSON.parse(attributes) : undefined,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }

  // Discount endpoints
  @Get('discounts/active')
  findDiscountedProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.productsService.findDiscountedProducts({ page, limit })
  }

  @Get('discounts/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getDiscountStats() {
    return this.productsService.getDiscountStats()
  }

  @Patch(':id/discount')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  setDiscount(@Param('id') id: string, @Body() discountDto: SetDiscountDto) {
    return this.productsService.setDiscount(id, discountDto)
  }

  @Delete(':id/discount')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeDiscount(@Param('id') id: string) {
    return this.productsService.removeDiscount(id)
  }

  @Post('discounts/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  setBulkDiscount(@Body() bulkDiscountDto: BulkDiscountDto) {
    return this.productsService.setBulkDiscount(bulkDiscountDto)
  }

  @Delete('discounts/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeBulkDiscount(@Body() body: { productIds: string[] }) {
    return this.productsService.removeBulkDiscount(body.productIds)
  }
}
