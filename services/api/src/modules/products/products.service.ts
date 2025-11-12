import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product } from '../../database/entities'
import { CreateProductDto, UpdateProductDto } from '@fullmag/common'

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ data: Product[]; total: number }> {
    const [data, total] = await this.productsRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['category'],
    })
    return { data, total }
  }

  async findOne(id: string): Promise<Product> {
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
    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.delete(id)
  }
}
