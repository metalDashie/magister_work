import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from '../../database/entities'

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: ['children', 'parent'],
    })
  }

  async findOne(id: number): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { id },
      relations: ['children', 'parent', 'products'],
    })
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
