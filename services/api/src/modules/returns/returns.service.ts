import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ReturnRequest, ReturnStatus, ReturnReason, Order, OrderItem } from '../../database/entities'
import { OrderStatus } from '@fullmag/common'

export interface CreateReturnDto {
  orderId: string
  orderItemId?: string
  reason: ReturnReason
  description?: string
  images?: string[]
  quantity?: number
}

export interface ProcessReturnDto {
  status: ReturnStatus
  adminNotes?: string
  refundAmount?: number
}

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private returnRepo: Repository<ReturnRequest>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
  ) {}

  async findAll(status?: ReturnStatus): Promise<ReturnRequest[]> {
    const where: any = {}
    if (status) {
      where.status = status
    }
    return this.returnRepo.find({
      where,
      relations: ['order', 'user', 'orderItem', 'orderItem.product'],
      order: { createdAt: 'DESC' },
    })
  }

  async findByUser(userId: string): Promise<ReturnRequest[]> {
    return this.returnRepo.find({
      where: { userId },
      relations: ['order', 'orderItem', 'orderItem.product'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findOne({
      where: { id },
      relations: ['order', 'user', 'orderItem', 'orderItem.product', 'processor'],
    })
    if (!returnRequest) {
      throw new NotFoundException('Return request not found')
    }
    return returnRequest
  }

  async create(userId: string, dto: CreateReturnDto): Promise<ReturnRequest> {
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, userId },
      relations: ['items'],
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    // Check if order is eligible for return (delivered status)
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned')
    }

    // Check if not too late for return (30 days)
    const deliveryDate = order.updatedAt
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceDelivery > 30) {
      throw new BadRequestException('Return period has expired (30 days)')
    }

    // Check for existing pending return for same order/item
    const existingReturn = await this.returnRepo.findOne({
      where: {
        orderId: dto.orderId,
        orderItemId: dto.orderItemId || undefined,
        status: ReturnStatus.PENDING,
      },
    })
    if (existingReturn) {
      throw new BadRequestException('A return request for this item is already pending')
    }

    const returnRequest = this.returnRepo.create({
      ...dto,
      userId,
      quantity: dto.quantity || 1,
    })

    return this.returnRepo.save(returnRequest)
  }

  async process(
    id: string,
    adminId: string,
    dto: ProcessReturnDto,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id)

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Return request has already been processed')
    }

    returnRequest.status = dto.status
    returnRequest.adminNotes = dto.adminNotes || null
    returnRequest.processedBy = adminId
    returnRequest.processedAt = new Date()

    if (dto.refundAmount !== undefined) {
      returnRequest.refundAmount = dto.refundAmount
    }

    return this.returnRepo.save(returnRequest)
  }

  async updateStatus(id: string, status: ReturnStatus): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id)
    returnRequest.status = status
    return this.returnRepo.save(returnRequest)
  }

  async getStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
    refunded: number
    completed: number
  }> {
    const [total, pending, approved, rejected, refunded, completed] = await Promise.all([
      this.returnRepo.count(),
      this.returnRepo.count({ where: { status: ReturnStatus.PENDING } }),
      this.returnRepo.count({ where: { status: ReturnStatus.APPROVED } }),
      this.returnRepo.count({ where: { status: ReturnStatus.REJECTED } }),
      this.returnRepo.count({ where: { status: ReturnStatus.REFUNDED } }),
      this.returnRepo.count({ where: { status: ReturnStatus.COMPLETED } }),
    ])

    return { total, pending, approved, rejected, refunded, completed }
  }

  getReturnReasons(): { value: ReturnReason; label: string }[] {
    return [
      { value: ReturnReason.DEFECTIVE, label: 'Defective product' },
      { value: ReturnReason.WRONG_ITEM, label: 'Wrong item received' },
      { value: ReturnReason.NOT_AS_DESCRIBED, label: 'Not as described' },
      { value: ReturnReason.CHANGED_MIND, label: 'Changed my mind' },
      { value: ReturnReason.DAMAGED_IN_SHIPPING, label: 'Damaged in shipping' },
      { value: ReturnReason.OTHER, label: 'Other reason' },
    ]
  }
}
