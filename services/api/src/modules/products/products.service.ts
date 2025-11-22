import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, MoreThanOrEqual, LessThanOrEqual, MoreThan } from 'typeorm'
import { Product } from '../../database/entities'
import { CreateProductDto, UpdateProductDto } from '@fullmag/common'

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
    private productsRepository: Repository<Product>
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

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search OR product.sku LIKE :search)',
        { search: `%${search}%` }
      )
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId })
    }

    // Price filters
    if (minPrice !== undefined && minPrice !== null) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice })
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice })
    }

    // Stock filter
    if (inStock === true) {
      queryBuilder.andWhere('product.stock > 0')
    } else if (inStock === false) {
      queryBuilder.andWhere('product.stock = 0')
    }

    // Attribute filters
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([attributeSlug, value], index) => {
        const alias = `attr_${index}`
        const valueParam = `attrValue_${index}`

        queryBuilder
          .innerJoin('product.productAttributes', alias)
          .innerJoin(`${alias}.attribute`, `${alias}_attr`)
          .andWhere(`${alias}_attr.slug = :${alias}_slug`, { [`${alias}_slug`]: attributeSlug })

        // Handle different value types
        if (Array.isArray(value)) {
          // For multi-select or value IN array
          queryBuilder.andWhere(`${alias}.value::jsonb ?| ARRAY[:...${valueParam}]`, {
            [valueParam]: value,
          })
        } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
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
      })
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
      relations: ['category'],
    })
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto)
    return this.productsRepository.save(product)
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
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
}
