import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { Category } from '../../database/entities'

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {}

  async findAll(): Promise<Category[]> {
    // Only return root categories (no parent), with children nested
    return this.categoriesRepository.find({
      where: { parentId: IsNull() },
      relations: ['children', 'children.children'],
      order: { name: 'ASC' },
    })
  }

  async findAllFlat(): Promise<Category[]> {
    // Return all categories in flat list (for dropdowns/selects)
    return this.categoriesRepository.find({
      relations: ['parent'],
      order: { name: 'ASC' },
    })
  }

  async findOne(id: number): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { id },
      relations: ['children', 'parent', 'products'],
    })
  }

  async create(data: Partial<Category>): Promise<Category> {
    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await this.categoriesRepository.findOne({
        where: { id: data.parentId },
      })
      if (!parent) {
        throw new BadRequestException('Parent category not found')
      }
    }

    const category = this.categoriesRepository.create(data)
    return this.categoriesRepository.save(category)
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    })

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    // Prevent setting parent to self or descendants
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent')
      }

      if (data.parentId !== null) {
        const descendants = await this.getAllDescendantIds(id)
        if (descendants.includes(data.parentId)) {
          throw new BadRequestException('Cannot set descendant as parent')
        }

        // Validate parent exists
        const parent = await this.categoriesRepository.findOne({
          where: { id: data.parentId },
        })
        if (!parent) {
          throw new BadRequestException('Parent category not found')
        }
      }
    }

    Object.assign(category, data)
    return this.categoriesRepository.save(category)
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['children', 'products'],
    })

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete subcategories first or move them to another category.',
      )
    }

    // Check if category has products
    if (category.products && category.products.length > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.products.length} products. Move products to another category first.`,
      )
    }

    await this.categoriesRepository.remove(category)
  }

  /**
   * Get all descendant category IDs (children, grandchildren, etc.) for a given category
   * Uses recursive CTE for efficient database-level recursion
   */
  async getAllDescendantIds(categoryId: number): Promise<number[]> {
    const result = await this.categoriesRepository.query(
      `
      WITH RECURSIVE category_tree AS (
        -- Base case: start with the given category
        SELECT id FROM categories WHERE id = $1
        UNION ALL
        -- Recursive case: get all children
        SELECT c.id FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT id FROM category_tree
      `,
      [categoryId]
    )

    return result.map((row: { id: number }) => row.id)
  }
}
