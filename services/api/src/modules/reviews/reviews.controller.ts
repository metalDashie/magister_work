import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'
import {
  CreateReviewDto,
  UpdateReviewDto,
  CreateReplyDto,
  UpdateReplyDto,
  CreateComplaintDto,
  GetReviewsQueryDto,
  ResolveComplaintDto,
} from './dto/review.dto'
import { ComplaintReason, ComplaintStatus } from '../../database/entities'

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==================== STATIC ROUTES (must come before :id routes) ====================

  /**
   * Get product rating statistics
   * GET /reviews/product/:productId/stats
   */
  @Get('product/:productId/stats')
  async getProductStats(@Param('productId') productId: string) {
    return await this.reviewsService.getProductRatingStats(productId)
  }

  /**
   * Get list of complaint reasons
   * GET /reviews/complaints/reasons
   */
  @Get('complaints/reasons')
  getComplaintReasons() {
    return {
      reasons: Object.values(ComplaintReason).map(reason => ({
        value: reason,
        label: this.getComplaintReasonLabel(reason),
      })),
    }
  }

  /**
   * Get all complaints (Admin only)
   * GET /reviews/complaints/all?status=pending
   */
  @Get('complaints/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getComplaints(@Query('status') status?: ComplaintStatus) {
    return await this.reviewsService.getComplaints(status)
  }

  /**
   * Get all reviews for admin (Admin only)
   * GET /reviews/admin/all?search=xxx&hasComplaints=true
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAllReviewsAdmin(
    @Query('search') search?: string,
    @Query('hasComplaints') hasComplaints?: string,
  ) {
    const hasComplaintsFlag = hasComplaints === 'true' ? true : undefined
    return await this.reviewsService.getAllReviewsAdmin(search, hasComplaintsFlag)
  }

  /**
   * Get review statistics (Admin only)
   * GET /reviews/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getReviewStats() {
    return await this.reviewsService.getReviewStats()
  }

  // ==================== REVIEWS ====================

  /**
   * Create a new review (authenticated users only)
   * POST /reviews
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(@Request() req, @Body() dto: CreateReviewDto) {
    const review = await this.reviewsService.createReview(req.user.userId, dto)
    return { success: true, review }
  }

  /**
   * Get reviews list (public, optional auth for like status)
   * GET /reviews?productId=xxx&sortBy=newest&page=1&limit=10
   */
  @Get()
  async getReviews(@Query() query: GetReviewsQueryDto, @Request() req) {
    const currentUserId = req.user?.userId
    return await this.reviewsService.getReviews(query, currentUserId)
  }

  /**
   * Create a reply to a review
   * POST /reviews/replies
   */
  @Post('replies')
  @UseGuards(JwtAuthGuard)
  async createReply(@Request() req, @Body() dto: CreateReplyDto) {
    const reply = await this.reviewsService.createReply(req.user.userId, dto)
    return { success: true, reply }
  }

  /**
   * Update own reply
   * PUT /reviews/replies/:id
   */
  @Put('replies/:id')
  @UseGuards(JwtAuthGuard)
  async updateReply(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateReplyDto,
  ) {
    const reply = await this.reviewsService.updateReply(req.user.userId, id, dto)
    return { success: true, reply }
  }

  /**
   * Delete own reply
   * DELETE /reviews/replies/:id
   */
  @Delete('replies/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReply(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN
    await this.reviewsService.deleteReply(req.user.userId, id, isAdmin)
  }

  /**
   * Report a review
   * POST /reviews/complaints
   */
  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  async createComplaint(@Request() req, @Body() dto: CreateComplaintDto) {
    const complaint = await this.reviewsService.createComplaint(req.user.userId, dto)
    return { success: true, complaint }
  }

  /**
   * Resolve a complaint (Admin only)
   * PUT /reviews/complaints/:id/resolve
   */
  @Put('complaints/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async resolveComplaint(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ResolveComplaintDto,
  ) {
    const complaint = await this.reviewsService.resolveComplaint(req.user.userId, id, dto)
    return { success: true, complaint }
  }

  // ==================== DYNAMIC :id ROUTES (must come after static routes) ====================

  /**
   * Get single review by ID
   * GET /reviews/:id
   */
  @Get(':id')
  async getReview(@Param('id') id: string, @Request() req) {
    const currentUserId = req.user?.userId
    return await this.reviewsService.getReview(id, currentUserId)
  }

  /**
   * Update own review
   * PUT /reviews/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.reviewsService.updateReview(req.user.userId, id, dto)
    return { success: true, review }
  }

  /**
   * Delete own review
   * DELETE /reviews/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN
    await this.reviewsService.deleteReview(req.user.userId, id, isAdmin)
  }

  /**
   * Toggle like on a review
   * POST /reviews/:id/like
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Request() req, @Param('id') reviewId: string) {
    return await this.reviewsService.toggleLike(req.user.userId, reviewId)
  }

  /**
   * Get replies for a review
   * GET /reviews/:id/replies
   */
  @Get(':id/replies')
  async getReplies(@Param('id') reviewId: string) {
    return await this.reviewsService.getReplies(reviewId)
  }

  /**
   * Toggle review visibility (Admin only)
   * PATCH /reviews/:id/visibility
   */
  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async toggleVisibility(@Param('id') id: string) {
    const review = await this.reviewsService.toggleReviewVisibility(id)
    return { success: true, review }
  }

  // Helper to get human-readable complaint reason labels
  private getComplaintReasonLabel(reason: ComplaintReason): string {
    const labels: Record<ComplaintReason, string> = {
      [ComplaintReason.SPAM]: 'Spam',
      [ComplaintReason.INAPPROPRIATE_CONTENT]: 'Inappropriate content',
      [ComplaintReason.FALSE_INFORMATION]: 'False or misleading information',
      [ComplaintReason.HARASSMENT]: 'Harassment or bullying',
      [ComplaintReason.OFF_TOPIC]: 'Off-topic or irrelevant',
      [ComplaintReason.ADVERTISING]: 'Advertising or promotion',
      [ComplaintReason.HATE_SPEECH]: 'Hate speech or discrimination',
      [ComplaintReason.PERSONAL_INFORMATION]: 'Contains personal information',
      [ComplaintReason.COPYRIGHT_VIOLATION]: 'Copyright violation',
      [ComplaintReason.OTHER]: 'Other',
    }
    return labels[reason]
  }
}
