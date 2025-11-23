import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm'
import { Banner, BannerStatus, BannerType } from '../../database/entities'

export interface CreateBannerDto {
  title: string
  description?: string
  content?: string
  imageUrl?: string
  buttonText?: string
  buttonUrl?: string
  backgroundColor?: string
  textColor?: string
  type?: BannerType
  status?: BannerStatus
  startDate?: Date
  endDate?: Date
  priority?: number
  showOnce?: boolean
  dismissible?: boolean
  pageTarget?: string
}

export interface UpdateBannerDto extends Partial<CreateBannerDto> {}

export interface FindBannersOptions {
  status?: BannerStatus
  type?: BannerType
  page?: number
  limit?: number
}

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannersRepository: Repository<Banner>,
  ) {}

  async findAll(options: FindBannersOptions = {}): Promise<{ data: Banner[]; total: number }> {
    const { status, type, page = 1, limit = 20 } = options

    const query = this.bannersRepository.createQueryBuilder('banner')

    if (status) {
      query.andWhere('banner.status = :status', { status })
    }

    if (type) {
      query.andWhere('banner.type = :type', { type })
    }

    query.orderBy('banner.priority', 'DESC')
    query.addOrderBy('banner.createdAt', 'DESC')

    const total = await query.getCount()
    query.skip((page - 1) * limit).take(limit)

    const data = await query.getMany()

    return { data, total }
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({ where: { id } })
    if (!banner) {
      throw new NotFoundException('Banner not found')
    }
    return banner
  }

  async findActive(pageTarget?: string, type?: BannerType): Promise<Banner[]> {
    const now = new Date()

    const query = this.bannersRepository.createQueryBuilder('banner')
      .where('banner.status = :status', { status: BannerStatus.ACTIVE })
      .andWhere('(banner.startDate IS NULL OR banner.startDate <= :now)', { now })
      .andWhere('(banner.endDate IS NULL OR banner.endDate >= :now)', { now })

    if (pageTarget && pageTarget !== 'all') {
      query.andWhere('(banner.pageTarget IS NULL OR banner.pageTarget = :pageTarget OR banner.pageTarget = :all)', {
        pageTarget,
        all: 'all',
      })
    }

    if (type) {
      query.andWhere('banner.type = :type', { type })
    }

    query.orderBy('banner.priority', 'DESC')
    query.addOrderBy('banner.createdAt', 'DESC')

    return query.getMany()
  }

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    const banner = this.bannersRepository.create(createBannerDto)
    return this.bannersRepository.save(banner)
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id)
    Object.assign(banner, updateBannerDto)
    return this.bannersRepository.save(banner)
  }

  async updateStatus(id: string, status: BannerStatus): Promise<Banner> {
    const banner = await this.findOne(id)
    banner.status = status
    return this.bannersRepository.save(banner)
  }

  async delete(id: string): Promise<void> {
    const result = await this.bannersRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Banner not found')
    }
  }

  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
    scheduled: number
  }> {
    const [total, active, inactive, scheduled] = await Promise.all([
      this.bannersRepository.count(),
      this.bannersRepository.count({ where: { status: BannerStatus.ACTIVE } }),
      this.bannersRepository.count({ where: { status: BannerStatus.INACTIVE } }),
      this.bannersRepository.count({ where: { status: BannerStatus.SCHEDULED } }),
    ])

    return { total, active, inactive, scheduled }
  }
}
