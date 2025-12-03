import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ElasticsearchService, ProductDocument } from './elasticsearch.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Product } from '../../database/entities'

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(
    private elasticsearchService: ElasticsearchService,
    @InjectRepository(Product)
    private productRepo: Repository<Product>
  ) {}

  /**
   * Search products using Elasticsearch
   */
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('categoryId') categoryId?: string,
    @Query('inStock') inStock?: string
  ) {
    const isAvailable = await this.elasticsearchService.isAvailable()
    if (!isAvailable) {
      throw new BadRequestException('Elasticsearch is not available')
    }

    const result = await this.elasticsearchService.searchProducts(query || '', {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      categoryId,
      inStock: inStock !== undefined ? inStock === 'true' : undefined
    })

    return result
  }

  /**
   * Get autocomplete suggestions
   */
  @Get('suggestions')
  async suggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string
  ) {
    const isAvailable = await this.elasticsearchService.isAvailable()
    if (!isAvailable) {
      return { suggestions: [] }
    }

    const suggestions = await this.elasticsearchService.getSuggestions(
      query || '',
      limit ? parseInt(limit, 10) : 10
    )

    return { suggestions }
  }

  /**
   * Sync all products from database to Elasticsearch
   * Admin only endpoint
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncProducts() {
    const isAvailable = await this.elasticsearchService.isAvailable()
    if (!isAvailable) {
      throw new BadRequestException('Elasticsearch is not available')
    }

    // Fetch all products from database with category
    const products = await this.productRepo.find({
      relations: ['category']
    })

    // Transform to Elasticsearch documents
    const documents: ProductDocument[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      price: product.price,
      stock: product.stock,
      categoryId: String(product.categoryId || ''),
      categoryName: product.category?.name || '',
      images: product.images || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }))

    // Clear existing index and bulk index all products
    await this.elasticsearchService.clearIndex()
    const result = await this.elasticsearchService.bulkIndexProducts(documents)

    return {
      message: 'Products synced to Elasticsearch',
      ...result,
      totalProducts: products.length
    }
  }

  /**
   * Get Elasticsearch status and stats
   */
  @Get('status')
  async getStatus() {
    const isAvailable = await this.elasticsearchService.isAvailable()

    if (!isAvailable) {
      return {
        available: false,
        message: 'Elasticsearch is not available'
      }
    }

    const stats = await this.elasticsearchService.getIndexStats()

    return {
      available: true,
      index: 'products',
      ...stats
    }
  }
}
