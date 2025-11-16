import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Product } from '../../database/entities'
import { CreateProductDto, UpdateProductDto } from '@fullmag/common'

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    search?: string
  ): Promise<{ data: Product[]; total: number }> {
    const where = search
      ? [
          { name: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
          { sku: Like(`%${search}%`) },
        ]
      : {}

    const [data, total] = await this.productsRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['category'],
      order: { createdAt: 'DESC' },
    })
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
