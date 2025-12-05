import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  Repository,
  Like,
  MoreThanOrEqual,
  LessThanOrEqual,
  MoreThan,
  In,
} from 'typeorm'
import { Product } from '../../database/entities'
import { CreateProductDto, UpdateProductDto } from '@fullmag/common'
import { CategoriesService } from '../categories/categories.service'

export interface SetDiscountDto {
  discountPercent: number
  discountStartDate?: Date | string
  discountEndDate?: Date | string
  discountActive?: boolean
}

export interface BulkDiscountDto {
  productIds: string[]
  discountPercent: number
  discountStartDate?: Date | string
  discountEndDate?: Date | string
  discountActive?: boolean
}

interface FindAllOptions {
  page?: number
  limit?: number
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  attributes?: Record<string, any> // Dynamic attributes filter
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private categoriesService: CategoriesService
  ) {}

  async findAll(
    options: FindAllOptions = {}
  ): Promise<{ data: Product[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options

    // Build where clause
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productAttributes', 'productAttribute')
      .leftJoinAndSelect('productAttribute.attribute', 'attribute')

    // Search filter (use ILIKE for case-insensitive, COALESCE to handle NULLs)
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR COALESCE(product.description, \'\') ILIKE :search OR COALESCE(product.sku, \'\') ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    // Category filter - includes selected category and all children categories
    if (categoryId) {
      const categoryIds =
        await this.categoriesService.getAllDescendantIds(categoryId)
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds,
      })
    }

    // Price filters
    if (minPrice !== undefined && minPrice !== null) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice })
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice })
    }

    // Stock filter
    if (inStock) {
      queryBuilder.andWhere('product.stock > 0')
    } else if (inStock === false) {
      queryBuilder.andWhere('product.stock = 0')
    }

    // Attribute filters
    if (options.attributes) {
      Object.entries(options.attributes).forEach(
        ([attributeSlug, value], index) => {
          const alias = `attr_${index}`
          const valueParam = `attrValue_${index}`

          queryBuilder
            .innerJoin('product.productAttributes', alias)
            .innerJoin(`${alias}.attribute`, `${alias}_attr`)
            .andWhere(`${alias}_attr.slug = :${alias}_slug`, {
              [`${alias}_slug`]: attributeSlug,
            })

          // Handle different value types
          if (Array.isArray(value)) {
            // For multi-select or value IN array
            queryBuilder.andWhere(
              `${alias}.value::jsonb ?| ARRAY[:...${valueParam}]`,
              {
                [valueParam]: value,
              }
            )
          } else if (
            typeof value === 'object' &&
            value.min !== undefined &&
            value.max !== undefined
          ) {
            // For range filters
            queryBuilder.andWhere(
              `(${alias}.value::jsonb->>'value')::numeric BETWEEN :${valueParam}_min AND :${valueParam}_max`,
              {
                [`${valueParam}_min`]: value.min,
                [`${valueParam}_max`]: value.max,
              }
            )
          } else {
            // For simple equality
            queryBuilder.andWhere(
              `${alias}.value::jsonb @> :${valueParam}::jsonb`,
              { [valueParam]: JSON.stringify(value) }
            )
          }
        }
      )
    }

    // Sorting
    const validSortFields = ['price', 'name', 'createdAt', 'stock']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    queryBuilder.orderBy(`product.${sortField}`, sortOrder)

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

    return { data, total }
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'productAttributes', 'productAttributes.attribute'],
    })
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto)
    return this.productsRepository.save(product)
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto
  ): Promise<Product> {
    await this.productsRepository.update(id, updateProductDto)
    const product = await this.findOne(id)
    if (!product) {
      throw new Error('Product not found')
    }
    return product
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.delete(id)
  }

  // Discount methods
  async setDiscount(id: string, discountDto: SetDiscountDto): Promise<Product> {
    const product = await this.findOne(id)
    if (!product) {
      throw new NotFoundException('Product not found')
    }

    await this.productsRepository.update(id, {
      discountPercent: discountDto.discountPercent,
      discountStartDate: discountDto.discountStartDate ? new Date(discountDto.discountStartDate) : null,
      discountEndDate: discountDto.discountEndDate ? new Date(discountDto.discountEndDate) : null,
      discountActive: discountDto.discountActive ?? true,
    })

    return this.findOne(id) as Promise<Product>
  }

  async removeDiscount(id: string): Promise<Product> {
    const product = await this.findOne(id)
    if (!product) {
      throw new NotFoundException('Product not found')
    }

    await this.productsRepository.update(id, {
      discountPercent: null,
      discountStartDate: null,
      discountEndDate: null,
      discountActive: false,
    })

    return this.findOne(id) as Promise<Product>
  }

  async setBulkDiscount(bulkDiscountDto: BulkDiscountDto): Promise<{ updated: number }> {
    const { productIds, discountPercent, discountStartDate, discountEndDate, discountActive } = bulkDiscountDto

    const result = await this.productsRepository.update(
      { id: In(productIds) },
      {
        discountPercent,
        discountStartDate: discountStartDate ? new Date(discountStartDate) : null,
        discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
        discountActive: discountActive ?? true,
      }
    )

    return { updated: result.affected || 0 }
  }

  async removeBulkDiscount(productIds: string[]): Promise<{ updated: number }> {
    const result = await this.productsRepository.update(
      { id: In(productIds) },
      {
        discountPercent: null,
        discountStartDate: null,
        discountEndDate: null,
        discountActive: false,
      }
    )

    return { updated: result.affected || 0 }
  }

  async findDiscountedProducts(options: { page?: number; limit?: number } = {}): Promise<{ data: Product[]; total: number }> {
    const { page = 1, limit = 20 } = options
    const now = new Date()

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.discountActive = :active', { active: true })
      .andWhere('product.discountPercent IS NOT NULL')
      .andWhere('product.discountPercent > 0')
      .andWhere('(product.discountStartDate IS NULL OR product.discountStartDate <= :now)', { now })
      .andWhere('(product.discountEndDate IS NULL OR product.discountEndDate >= :now)', { now })
      .orderBy('product.discountPercent', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()
    return { data, total }
  }

  async getDiscountStats(): Promise<{
    totalDiscounted: number
    activeDiscounts: number
    scheduledDiscounts: number
    expiredDiscounts: number
    averageDiscount: number
  }> {
    const now = new Date()

    const totalDiscounted = await this.productsRepository.count({
      where: { discountActive: true },
    })

    // Active discounts (currently valid)
    const activeDiscounts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.discountActive = :active', { active: true })
      .andWhere('product.discountPercent > 0')
      .andWhere('(product.discountStartDate IS NULL OR product.discountStartDate <= :now)', { now })
      .andWhere('(product.discountEndDate IS NULL OR product.discountEndDate >= :now)', { now })
      .getCount()

    // Scheduled discounts (start date in future)
    const scheduledDiscounts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.discountActive = :active', { active: true })
      .andWhere('product.discountStartDate > :now', { now })
      .getCount()

    // Expired discounts (end date in past but still marked active)
    const expiredDiscounts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.discountActive = :active', { active: true })
      .andWhere('product.discountEndDate < :now', { now })
      .getCount()

    // Average discount percentage
    const avgResult = await this.productsRepository
      .createQueryBuilder('product')
      .select('AVG(product.discountPercent)', 'avg')
      .where('product.discountActive = :active', { active: true })
      .andWhere('product.discountPercent > 0')
      .getRawOne()

    return {
      totalDiscounted,
      activeDiscounts,
      scheduledDiscounts,
      expiredDiscounts,
      averageDiscount: Math.round((avgResult?.avg || 0) * 100) / 100,
    }
  }
}
