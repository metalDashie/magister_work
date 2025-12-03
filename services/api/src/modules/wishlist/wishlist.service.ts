import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Wishlist, Product } from '../../database/entities'

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async getWishlist(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepo.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    })
  }

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const product = await this.productRepo.findOne({ where: { id: productId } })
    if (!product) {
      throw new NotFoundException('Product not found')
    }

    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId },
    })
    if (existing) {
      throw new ConflictException('Product already in wishlist')
    }

    const wishlistItem = this.wishlistRepo.create({ userId, productId })
    return this.wishlistRepo.save(wishlistItem)
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const result = await this.wishlistRepo.delete({ userId, productId })
    if (result.affected === 0) {
      throw new NotFoundException('Product not in wishlist')
    }
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await this.wishlistRepo.findOne({
      where: { userId, productId },
    })
    return !!item
  }

  async toggleWishlist(userId: string, productId: string): Promise<{ added: boolean }> {
    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId },
    })

    if (existing) {
      await this.wishlistRepo.remove(existing)
      return { added: false }
    } else {
      const product = await this.productRepo.findOne({ where: { id: productId } })
      if (!product) {
        throw new NotFoundException('Product not found')
      }
      const wishlistItem = this.wishlistRepo.create({ userId, productId })
      await this.wishlistRepo.save(wishlistItem)
      return { added: true }
    }
  }

  async getWishlistCount(userId: string): Promise<number> {
    return this.wishlistRepo.count({ where: { userId } })
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistRepo.delete({ userId })
  }
}
