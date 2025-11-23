import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import { User } from '../../database/entities'
import { UserRole } from '@fullmag/common'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find()
  }

  async findAllAdmin(search?: string, role?: string): Promise<User[]> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.phone',
        'user.role',
        'user.emailVerified',
        'user.createdAt',
        'user.updatedAt',
      ])
      .loadRelationCountAndMap('user.ordersCount', 'user.orders')

    if (search) {
      query.andWhere(
        '(user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      )
    }

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      query.andWhere('user.role = :role', { role })
    }

    query.orderBy('user.createdAt', 'DESC')

    return query.getMany()
  }

  async getStats(): Promise<{
    total: number
    admins: number
    managers: number
    users: number
    verified: number
    unverified: number
  }> {
    const [total, admins, managers, users, verified] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
      this.usersRepository.count({ where: { role: UserRole.MANAGER } }),
      this.usersRepository.count({ where: { role: UserRole.USER } }),
      this.usersRepository.count({ where: { emailVerified: true } }),
    ])

    return {
      total,
      admins,
      managers,
      users,
      verified,
      unverified: total - verified,
    }
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } })
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: MoreThan(new Date()),
      },
    })
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: MoreThan(new Date()),
      },
    })
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData)
    return this.usersRepository.save(user)
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData)
    const user = await this.findOne(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    user.role = role
    return this.usersRepository.save(user)
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('User not found')
    }
  }
}
