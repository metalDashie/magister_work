import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Attribute } from '../../database/entities/attribute.entity'

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private attributesRepository: Repository<Attribute>,
  ) {}

  async findAll(categoryId?: string): Promise<Attribute[]> {
    const query = this.attributesRepository
      .createQueryBuilder('attribute')
      .leftJoinAndSelect('attribute.category', 'category')
      .orderBy('attribute.sortOrder', 'ASC')
      .addOrderBy('attribute.name', 'ASC')

    if (categoryId) {
      query.where('attribute.categoryId = :categoryId OR attribute.categoryId IS NULL', {
        categoryId,
      })
    }

    return query.getMany()
  }

  async findOne(id: string): Promise<Attribute> {
    const attribute = await this.attributesRepository.findOne({
      where: { id },
      relations: ['category'],
    })

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`)
    }

    return attribute
  }

  async findBySlug(slug: string): Promise<Attribute> {
    const attribute = await this.attributesRepository.findOne({
      where: { slug },
      relations: ['category'],
    })

    if (!attribute) {
      throw new NotFoundException(`Attribute with slug ${slug} not found`)
    }

    return attribute
  }

  async create(createAttributeDto: Partial<Attribute>): Promise<Attribute> {
    const attribute = this.attributesRepository.create(createAttributeDto)
    return this.attributesRepository.save(attribute)
  }

  async update(id: string, updateAttributeDto: Partial<Attribute>): Promise<Attribute> {
    const attribute = await this.findOne(id)
    Object.assign(attribute, updateAttributeDto)
    return this.attributesRepository.save(attribute)
  }

  async remove(id: string): Promise<void> {
    const attribute = await this.findOne(id)
    await this.attributesRepository.remove(attribute)
  }

  async getFilterableAttributes(categoryId?: string): Promise<Attribute[]> {
    const query = this.attributesRepository
      .createQueryBuilder('attribute')
      .where('attribute.isFilterable = :isFilterable', { isFilterable: true })
      .andWhere('attribute.isVisible = :isVisible', { isVisible: true })
      .orderBy('attribute.sortOrder', 'ASC')

    if (categoryId) {
      query.andWhere('(attribute.categoryId = :categoryId OR attribute.categoryId IS NULL)', {
        categoryId,
      })
    }

    return query.getMany()
  }
}
