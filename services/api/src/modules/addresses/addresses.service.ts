import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserAddress } from '../../database/entities'

export interface CreateAddressDto {
  title: string
  recipientName: string
  recipientPhone: string
  city: string
  address?: string
  warehouse?: string
  postalCode?: string
  deliveryType?: string
  isDefault?: boolean
}

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(UserAddress)
    private addressRepo: Repository<UserAddress>,
  ) {}

  async findAll(userId: string): Promise<UserAddress[]> {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    })
  }

  async findOne(userId: string, id: string): Promise<UserAddress> {
    const address = await this.addressRepo.findOne({
      where: { id, userId },
    })
    if (!address) {
      throw new NotFoundException('Address not found')
    }
    return address
  }

  async findDefault(userId: string): Promise<UserAddress | null> {
    return this.addressRepo.findOne({
      where: { userId, isDefault: true },
    })
  }

  async create(userId: string, dto: CreateAddressDto): Promise<UserAddress> {
    // If this is the first address or marked as default, handle default logic
    if (dto.isDefault) {
      await this.clearDefaultAddress(userId)
    } else {
      // If no addresses exist, make this one default
      const count = await this.addressRepo.count({ where: { userId } })
      if (count === 0) {
        dto.isDefault = true
      }
    }

    const address = this.addressRepo.create({
      ...dto,
      userId,
    })

    return this.addressRepo.save(address)
  }

  async update(userId: string, id: string, dto: Partial<CreateAddressDto>): Promise<UserAddress> {
    const address = await this.findOne(userId, id)

    if (dto.isDefault) {
      await this.clearDefaultAddress(userId)
    }

    Object.assign(address, dto)
    return this.addressRepo.save(address)
  }

  async delete(userId: string, id: string): Promise<void> {
    const address = await this.findOne(userId, id)
    const wasDefault = address.isDefault

    await this.addressRepo.remove(address)

    // If deleted address was default, set another as default
    if (wasDefault) {
      const firstAddress = await this.addressRepo.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      })
      if (firstAddress) {
        firstAddress.isDefault = true
        await this.addressRepo.save(firstAddress)
      }
    }
  }

  async setDefault(userId: string, id: string): Promise<UserAddress> {
    const address = await this.findOne(userId, id)

    await this.clearDefaultAddress(userId)

    address.isDefault = true
    return this.addressRepo.save(address)
  }

  private async clearDefaultAddress(userId: string): Promise<void> {
    await this.addressRepo.update(
      { userId, isDefault: true },
      { isDefault: false },
    )
  }

  async getCount(userId: string): Promise<number> {
    return this.addressRepo.count({ where: { userId } })
  }
}
