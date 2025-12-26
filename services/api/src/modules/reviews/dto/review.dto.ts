import { IsString, IsInt, IsOptional, IsArray, Min, Max, IsEnum, IsUUID, MinLength, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ComplaintReason } from '../../../database/entities/review-complaint.entity'

// Create Review
export class CreateReviewDto {
  @IsUUID()
  productId: string

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]
}

// Update Review
export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]
}

// Create Reply
export class CreateReplyDto {
  @IsUUID()
  reviewId: string

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string

  @IsOptional()
  @IsUUID()
  parentReplyId?: string
}

// Update Reply
export class UpdateReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string
}

// Create Complaint
export class CreateComplaintDto {
  @IsUUID()
  reviewId: string

  @IsEnum(ComplaintReason)
  reason: ComplaintReason

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string
}

// Query params for listing reviews
export class GetReviewsQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string

  @IsOptional()
  @IsUUID()
  userId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number

  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'mostLiked'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

// Admin: Resolve complaint
export class ResolveComplaintDto {
  @IsEnum(['resolved', 'dismissed'])
  status: 'resolved' | 'dismissed'

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string

  @IsOptional()
  hideReview?: boolean
}
