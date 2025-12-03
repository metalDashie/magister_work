import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CompareItem, Product } from '../../database/entities'

const MAX_COMPARE_ITEMS = 4

@Injectable()
export class CompareService {
  constructor(
    @InjectRepository(CompareItem)
    private compareItemRepository: Repository<CompareItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {}

  async getCompareList(userId: string) {
    const items = await this.compareItemRepository.find({
      where: { userId },
      relations: [
        'product',
        'product.category',
        'product.productAttributes',
        'product.productAttributes.attribute',
      ],
      order: { createdAt: 'ASC' },
    })

    return {
      items: items.map((item) => item.product),
      count: items.length,
    }
  }

  async addToCompare(userId: string, productId: string) {
    // Check if already in compare list
    const existing = await this.compareItemRepository.findOne({
      where: { userId, productId },
    })

    if (existing) {
      return { added: false, message: 'Product already in compare list' }
    }

    // Check limit
    const count = await this.compareItemRepository.count({ where: { userId } })
    if (count >= MAX_COMPARE_ITEMS) {
      throw new BadRequestException(
        `Cannot add more than ${MAX_COMPARE_ITEMS} products to compare`
      )
    }

    // Verify product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    })

    if (!product) {
      throw new BadRequestException('Product not found')
    }

    const compareItem = this.compareItemRepository.create({
      userId,
      productId,
    })

    await this.compareItemRepository.save(compareItem)

    return { added: true, message: 'Product added to compare list' }
  }

  async removeFromCompare(userId: string, productId: string) {
    const result = await this.compareItemRepository.delete({
      userId,
      productId,
    })

    return {
      removed: (result.affected ?? 0) > 0,
      message:
        (result.affected ?? 0) > 0
          ? 'Product removed from compare list'
          : 'Product not in compare list',
    }
  }

  async toggleCompare(userId: string, productId: string) {
    const existing = await this.compareItemRepository.findOne({
      where: { userId, productId },
    })

    if (existing) {
      await this.compareItemRepository.delete({ userId, productId })
      return { added: false, message: 'Removed from compare list' }
    }

    // Check limit
    const count = await this.compareItemRepository.count({ where: { userId } })
    if (count >= MAX_COMPARE_ITEMS) {
      throw new BadRequestException(
        `Cannot add more than ${MAX_COMPARE_ITEMS} products to compare`
      )
    }

    const compareItem = this.compareItemRepository.create({
      userId,
      productId,
    })

    await this.compareItemRepository.save(compareItem)

    return { added: true, message: 'Added to compare list' }
  }

  async clearCompareList(userId: string) {
    await this.compareItemRepository.delete({ userId })
    return { message: 'Compare list cleared' }
  }

  async isInCompareList(userId: string, productId: string): Promise<boolean> {
    const item = await this.compareItemRepository.findOne({
      where: { userId, productId },
    })
    return !!item
  }

  async getCompareData(userId: string) {
    const { items: products } = await this.getCompareList(userId)

    if (products.length === 0) {
      return {
        products: [],
        attributes: [],
        comparison: {},
      }
    }

    // Collect all unique attributes from all products
    const attributeMap = new Map<
      string,
      { id: string; name: string; unit: string | null; sortOrder: number }
    >()

    for (const product of products) {
      if (product.productAttributes) {
        for (const pa of product.productAttributes) {
          if (pa.attribute && !attributeMap.has(pa.attribute.id)) {
            attributeMap.set(pa.attribute.id, {
              id: pa.attribute.id,
              name: pa.attribute.name,
              unit: pa.attribute.unit,
              sortOrder: pa.attribute.sortOrder,
            })
          }
        }
      }
    }

    // Sort attributes by sortOrder
    const attributes = Array.from(attributeMap.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    )

    // Build comparison data
    const comparison: Record<string, Record<string, any>> = {}

    for (const attr of attributes) {
      comparison[attr.id] = {}
      for (const product of products) {
        const productAttr = product.productAttributes?.find(
          (pa) => pa.attributeId === attr.id
        )
        comparison[attr.id][product.id] = productAttr?.value ?? null
      }
    }

    // Format products for response
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      currency: product.currency,
      stock: product.stock,
      images: product.images,
      category: product.category?.name,
      discountPercent: product.discountPercent,
      discountActive: product.discountActive,
      discountStartDate: product.discountStartDate,
      discountEndDate: product.discountEndDate,
      averageRating: product.averageRating,
      reviewsCount: product.reviewsCount,
    }))

    return {
      products: formattedProducts,
      attributes,
      comparison,
    }
  }
}
