import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Coupon, CouponUsage, CouponStatus, CouponType } from '../../database/entities'

export interface CreateCouponDto {
  code: string
  description?: string
  type: CouponType
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usageLimitPerUser?: number
  startDate?: Date
  endDate?: Date
}

export interface ApplyCouponResult {
  valid: boolean
  discountAmount: number
  message?: string
  coupon?: Coupon
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepo: Repository<CouponUsage>,
  ) {}

  async findAll(): Promise<Coupon[]> {
    return this.couponRepo.find({
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id } })
    if (!coupon) {
      throw new NotFoundException('Coupon not found')
    }
    return coupon
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepo.findOne({
      where: { code: code.toUpperCase() },
    })
  }

  async create(dto: CreateCouponDto, createdBy?: string): Promise<Coupon> {
    const existing = await this.findByCode(dto.code)
    if (existing) {
      throw new ConflictException('Coupon code already exists')
    }

    const coupon = this.couponRepo.create({
      ...dto,
      code: dto.code.toUpperCase(),
      createdBy,
    })
    return this.couponRepo.save(coupon)
  }

  async update(id: string, dto: Partial<CreateCouponDto>): Promise<Coupon> {
    const coupon = await this.findOne(id)

    if (dto.code && dto.code !== coupon.code) {
      const existing = await this.findByCode(dto.code)
      if (existing) {
        throw new ConflictException('Coupon code already exists')
      }
      dto.code = dto.code.toUpperCase()
    }

    Object.assign(coupon, dto)
    return this.couponRepo.save(coupon)
  }

  async delete(id: string): Promise<void> {
    const result = await this.couponRepo.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Coupon not found')
    }
  }

  async toggleStatus(id: string): Promise<Coupon> {
    const coupon = await this.findOne(id)
    coupon.status = coupon.status === CouponStatus.ACTIVE
      ? CouponStatus.INACTIVE
      : CouponStatus.ACTIVE
    return this.couponRepo.save(coupon)
  }

  async validateCoupon(
    code: string,
    userId: string,
    orderAmount: number,
  ): Promise<ApplyCouponResult> {
    const coupon = await this.findByCode(code)

    if (!coupon) {
      return { valid: false, discountAmount: 0, message: 'Coupon not found' }
    }

    if (!coupon.isValid()) {
      return { valid: false, discountAmount: 0, message: 'Coupon is not valid or has expired' }
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order amount is ${coupon.minOrderAmount}`
      }
    }

    // Check user usage limit
    const userUsageCount = await this.couponUsageRepo.count({
      where: { couponId: coupon.id, userId },
    })
    if (userUsageCount >= coupon.usageLimitPerUser) {
      return { valid: false, discountAmount: 0, message: 'You have already used this coupon' }
    }

    const discountAmount = this.calculateDiscount(coupon, orderAmount)

    return { valid: true, discountAmount, coupon }
  }

  calculateDiscount(coupon: Coupon, orderAmount: number): number {
    let discount = 0

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = orderAmount * (Number(coupon.value) / 100)
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, Number(coupon.maxDiscountAmount))
        }
        break
      case CouponType.FIXED_AMOUNT:
        discount = Number(coupon.value)
        break
      case CouponType.FREE_SHIPPING:
        discount = 0 // Handled separately in shipping
        break
    }

    return Math.min(discount, orderAmount)
  }

  async recordUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
  ): Promise<CouponUsage> {
    const coupon = await this.findOne(couponId)

    const usage = this.couponUsageRepo.create({
      couponId,
      userId,
      orderId,
      discountAmount,
    })

    coupon.timesUsed += 1
    await this.couponRepo.save(coupon)

    return this.couponUsageRepo.save(usage)
  }

  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
    expired: number
    totalUsage: number
  }> {
    const now = new Date()
    const [total, active, inactive, totalUsage] = await Promise.all([
      this.couponRepo.count(),
      this.couponRepo.count({ where: { status: CouponStatus.ACTIVE } }),
      this.couponRepo.count({ where: { status: CouponStatus.INACTIVE } }),
      this.couponUsageRepo.count(),
    ])

    const expired = await this.couponRepo
      .createQueryBuilder('coupon')
      .where('coupon.endDate < :now', { now })
      .getCount()

    return { total, active, inactive, expired, totalUsage }
  }
}
