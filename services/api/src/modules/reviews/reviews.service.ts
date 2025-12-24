import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  Review,
  ReviewLike,
  ReviewReply,
  ReviewComplaint,
  ComplaintStatus,
  Product,
  Order,
} from '../../database/entities'
import {
  CreateReviewDto,
  UpdateReviewDto,
  CreateReplyDto,
  UpdateReplyDto,
  CreateComplaintDto,
  GetReviewsQueryDto,
  ResolveComplaintDto,
} from './dto/review.dto'

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ReviewLike)
    private likeRepo: Repository<ReviewLike>,
    @InjectRepository(ReviewReply)
    private replyRepo: Repository<ReviewReply>,
    @InjectRepository(ReviewComplaint)
    private complaintRepo: Repository<ReviewComplaint>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // ==================== REVIEWS ====================

  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Check if product exists
    const product = await this.productRepo.findOne({ where: { id: dto.productId } })
    if (!product) {
      throw new NotFoundException('Product not found')
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    })
    if (existingReview) {
      throw new ConflictException('You have already reviewed this product')
    }

    // Check if user has purchased this product (verified purchase)
    const hasPurchased = await this.checkVerifiedPurchase(userId, dto.productId)

    const review = this.reviewRepo.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      title: dto.title || null,
      content: dto.content,
      images: dto.images || null,
      isVerifiedPurchase: hasPurchased,
    })

    const savedReview = await this.reviewRepo.save(review)

    // Update product rating stats
    await this.updateProductRatingStats(dto.productId)

    return savedReview
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } })
    if (!review) {
      throw new NotFoundException('Review not found')
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews')
    }

    const ratingChanged = dto.rating !== undefined && dto.rating !== review.rating

    if (dto.rating !== undefined) review.rating = dto.rating
    if (dto.title !== undefined) review.title = dto.title
    if (dto.content !== undefined) review.content = dto.content
    if (dto.images !== undefined) review.images = dto.images

    const savedReview = await this.reviewRepo.save(review)

    // Update product rating stats if rating changed
    if (ratingChanged) {
      await this.updateProductRatingStats(review.productId)
    }

    return savedReview
  }

  async deleteReview(userId: string, reviewId: string, isAdmin = false): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } })
    if (!review) {
      throw new NotFoundException('Review not found')
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews')
    }

    const productId = review.productId
    await this.reviewRepo.remove(review)

    // Update product rating stats after deletion
    await this.updateProductRatingStats(productId)
  }

  async getReview(reviewId: string, currentUserId?: string): Promise<any> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, isVisible: true },
      relations: ['user', 'replies', 'replies.user'],
    })

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    // Check if current user liked this review
    let isLikedByCurrentUser = false
    if (currentUserId) {
      const like = await this.likeRepo.findOne({
        where: { userId: currentUserId, reviewId },
      })
      isLikedByCurrentUser = !!like
    }

    return {
      ...review,
      isLikedByCurrentUser,
      user: review.user ? {
        id: review.user.id,
        email: review.user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      } : null,
    }
  }

  async getReviews(query: GetReviewsQueryDto, currentUserId?: string): Promise<{
    reviews: any[]
    total: number
    page: number
    totalPages: number
    averageRating: number | null
    ratingDistribution: Record<number, number>
  }> {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const qb = this.reviewRepo.createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.isVisible = :isVisible', { isVisible: true })

    if (query.productId) {
      qb.andWhere('review.productId = :productId', { productId: query.productId })
    }

    if (query.userId) {
      qb.andWhere('review.userId = :userId', { userId: query.userId })
    }

    if (query.rating) {
      qb.andWhere('review.rating = :rating', { rating: query.rating })
    }

    // Sorting
    switch (query.sortBy) {
      case 'oldest':
        qb.orderBy('review.createdAt', 'ASC')
        break
      case 'highest':
        qb.orderBy('review.rating', 'DESC')
        break
      case 'lowest':
        qb.orderBy('review.rating', 'ASC')
        break
      case 'mostLiked':
        qb.orderBy('review.likesCount', 'DESC')
        break
      case 'newest':
      default:
        qb.orderBy('review.createdAt', 'DESC')
    }

    const [reviews, total] = await qb.skip(skip).take(limit).getManyAndCount()

    // Get likes status for current user
    let userLikes: Record<string, boolean> = {}
    if (currentUserId && reviews.length > 0) {
      const reviewIds = reviews.map(r => r.id)
      const likes = await this.likeRepo
        .createQueryBuilder('like')
        .where('like.userId = :userId', { userId: currentUserId })
        .andWhere('like.reviewId IN (:...reviewIds)', { reviewIds })
        .getMany()
      userLikes = likes.reduce((acc, like) => ({ ...acc, [like.reviewId]: true }), {})
    }

    // Calculate average rating and distribution for product
    let averageRating: number | null = null
    let ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    if (query.productId) {
      const stats = await this.reviewRepo
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'avg')
        .addSelect('review.rating', 'rating')
        .addSelect('COUNT(*)', 'count')
        .where('review.productId = :productId', { productId: query.productId })
        .andWhere('review.isVisible = :isVisible', { isVisible: true })
        .groupBy('review.rating')
        .getRawMany()

      let totalRating = 0
      let totalCount = 0
      stats.forEach(stat => {
        const rating = parseInt(stat.rating)
        const count = parseInt(stat.count)
        ratingDistribution[rating] = count
        totalRating += rating * count
        totalCount += count
      })
      averageRating = totalCount > 0 ? totalRating / totalCount : null
    }

    return {
      reviews: reviews.map(review => ({
        ...review,
        isLikedByCurrentUser: userLikes[review.id] || false,
        user: review.user ? {
          id: review.user.id,
          email: review.user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        } : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating,
      ratingDistribution,
    }
  }

  // ==================== LIKES ====================

  async toggleLike(userId: string, reviewId: string): Promise<{ liked: boolean; likesCount: number }> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } })
    if (!review) {
      throw new NotFoundException('Review not found')
    }

    // Can't like your own review
    if (review.userId === userId) {
      throw new BadRequestException("You can't like your own review")
    }

    const existingLike = await this.likeRepo.findOne({
      where: { userId, reviewId },
    })

    if (existingLike) {
      // Unlike
      await this.likeRepo.remove(existingLike)
      review.likesCount = Math.max(0, review.likesCount - 1)
      await this.reviewRepo.save(review)
      return { liked: false, likesCount: review.likesCount }
    } else {
      // Like
      const like = this.likeRepo.create({ userId, reviewId })
      await this.likeRepo.save(like)
      review.likesCount += 1
      await this.reviewRepo.save(review)
      return { liked: true, likesCount: review.likesCount }
    }
  }

  // ==================== REPLIES ====================

  async createReply(userId: string, dto: CreateReplyDto): Promise<ReviewReply> {
    const review = await this.reviewRepo.findOne({ where: { id: dto.reviewId } })
    if (!review) {
      throw new NotFoundException('Review not found')
    }

    // Check parent reply exists if provided
    if (dto.parentReplyId) {
      const parentReply = await this.replyRepo.findOne({
        where: { id: dto.parentReplyId, reviewId: dto.reviewId },
      })
      if (!parentReply) {
        throw new NotFoundException('Parent reply not found')
      }
    }

    const reply = this.replyRepo.create({
      reviewId: dto.reviewId,
      userId,
      content: dto.content,
      parentReplyId: dto.parentReplyId || null,
    })

    const savedReply = await this.replyRepo.save(reply)

    // Update replies count
    review.repliesCount += 1
    await this.reviewRepo.save(review)

    return savedReply
  }

  async updateReply(userId: string, replyId: string, dto: UpdateReplyDto): Promise<ReviewReply> {
    const reply = await this.replyRepo.findOne({ where: { id: replyId } })
    if (!reply) {
      throw new NotFoundException('Reply not found')
    }

    if (reply.userId !== userId) {
      throw new ForbiddenException('You can only edit your own replies')
    }

    reply.content = dto.content
    return await this.replyRepo.save(reply)
  }

  async deleteReply(userId: string, replyId: string, isAdmin = false): Promise<void> {
    const reply = await this.replyRepo.findOne({ where: { id: replyId } })
    if (!reply) {
      throw new NotFoundException('Reply not found')
    }

    if (!isAdmin && reply.userId !== userId) {
      throw new ForbiddenException('You can only delete your own replies')
    }

    // Update replies count on review
    const review = await this.reviewRepo.findOne({ where: { id: reply.reviewId } })
    if (review) {
      review.repliesCount = Math.max(0, review.repliesCount - 1)
      await this.reviewRepo.save(review)
    }

    await this.replyRepo.remove(reply)
  }

  async getReplies(reviewId: string): Promise<ReviewReply[]> {
    return await this.replyRepo.find({
      where: { reviewId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    })
  }

  // ==================== COMPLAINTS ====================

  async createComplaint(userId: string, dto: CreateComplaintDto): Promise<ReviewComplaint> {
    const review = await this.reviewRepo.findOne({ where: { id: dto.reviewId } })
    if (!review) {
      throw new NotFoundException('Review not found')
    }

    // Can't complain about your own review
    if (review.userId === userId) {
      throw new BadRequestException("You can't report your own review")
    }

    // Check if already complained
    const existingComplaint = await this.complaintRepo.findOne({
      where: { userId, reviewId: dto.reviewId },
    })
    if (existingComplaint) {
      throw new ConflictException('You have already reported this review')
    }

    const complaint = this.complaintRepo.create({
      reviewId: dto.reviewId,
      userId,
      reason: dto.reason,
      description: dto.description || null,
    })

    return await this.complaintRepo.save(complaint)
  }

  async getComplaints(status?: ComplaintStatus): Promise<ReviewComplaint[]> {
    const where: any = {}
    if (status) {
      where.status = status
    }

    return await this.complaintRepo.find({
      where,
      relations: ['review', 'review.user', 'review.product', 'user', 'resolver'],
      order: { createdAt: 'DESC' },
    })
  }

  async getAllReviewsAdmin(search?: string, hasComplaints?: boolean): Promise<any[]> {
    const qb = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .loadRelationCountAndMap('review.complaintsCount', 'review.complaints')
      .loadRelationCountAndMap(
        'review.pendingComplaintsCount',
        'review.complaints',
        'pendingComplaints',
        (qb) => qb.where('pendingComplaints.status = :status', { status: ComplaintStatus.PENDING }),
      )

    if (search) {
      qb.andWhere(
        '(review.content ILIKE :search OR review.title ILIKE :search OR user.email ILIKE :search OR product.name ILIKE :search)',
        { search: `%${search}%` },
      )
    }

    qb.orderBy('review.createdAt', 'DESC')

    const reviews = await qb.getMany()

    // Filter by hasComplaints if specified
    if (hasComplaints === true) {
      return reviews.filter((r: any) => r.complaintsCount > 0)
    }

    return reviews
  }

  async getReviewStats(): Promise<{
    total: number
    visible: number
    hidden: number
    withComplaints: number
    pendingComplaints: number
  }> {
    const [total, visible, withComplaints, pendingComplaints] = await Promise.all([
      this.reviewRepo.count(),
      this.reviewRepo.count({ where: { isVisible: true } }),
      this.reviewRepo
        .createQueryBuilder('review')
        .innerJoin('review.complaints', 'complaint')
        .getCount(),
      this.complaintRepo.count({ where: { status: ComplaintStatus.PENDING } }),
    ])

    return {
      total,
      visible,
      hidden: total - visible,
      withComplaints,
      pendingComplaints,
    }
  }

  async toggleReviewVisibility(reviewId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } })
    if (!review) {
      throw new NotFoundException('Review not found')
    }
    review.isVisible = !review.isVisible
    return await this.reviewRepo.save(review)
  }

  async resolveComplaint(
    adminId: string,
    complaintId: string,
    dto: ResolveComplaintDto,
  ): Promise<ReviewComplaint> {
    const complaint = await this.complaintRepo.findOne({
      where: { id: complaintId },
      relations: ['review'],
    })
    if (!complaint) {
      throw new NotFoundException('Complaint not found')
    }

    complaint.status = dto.status === 'resolved' ? ComplaintStatus.RESOLVED : ComplaintStatus.DISMISSED
    complaint.adminNotes = dto.adminNotes || null
    complaint.resolvedBy = adminId
    complaint.resolvedAt = new Date()

    // Hide the review if requested
    if (dto.hideReview && dto.status === 'resolved' && complaint.review) {
      complaint.review.isVisible = false
      await this.reviewRepo.save(complaint.review)
    }

    return await this.complaintRepo.save(complaint)
  }

  // ==================== HELPERS ====================

  private async updateProductRatingStats(productId: string): Promise<void> {
    const stats = await this.getProductRatingStats(productId)
    await this.productRepo.update(productId, {
      averageRating: stats.averageRating,
      reviewsCount: stats.totalReviews,
    })
  }

  private async checkVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    // Check if user has a delivered order containing this product
    const order = await this.orderRepo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('order.userId = :userId', { userId })
      .andWhere('item.productId = :productId', { productId })
      .andWhere('order.status = :status', { status: 'delivered' })
      .getOne()

    return !!order
  }

  async getProductRatingStats(productId: string): Promise<{
    averageRating: number | null
    totalReviews: number
    ratingDistribution: Record<number, number>
  }> {
    const reviews = await this.reviewRepo.find({
      where: { productId, isVisible: true },
      select: ['rating'],
    })

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRating = 0

    reviews.forEach(review => {
      ratingDistribution[review.rating]++
      totalRating += review.rating
    })

    return {
      averageRating: reviews.length > 0 ? totalRating / reviews.length : null,
      totalReviews: reviews.length,
      ratingDistribution,
    }
  }
}
