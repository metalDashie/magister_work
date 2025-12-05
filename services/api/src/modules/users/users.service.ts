import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { User } from '../../database/entities'
import { UserRole } from '@fullmag/common'
import { EmailService } from '../email/email.service'
import { SmsService } from '../sms/sms.service'
import {
  UpdateProfileDto,
  ChangeEmailDto,
  ChangePhoneDto,
  ChangePasswordDto,
} from './dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

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
        'user.firstName',
        'user.lastName',
        'user.emailVerified',
        'user.phoneVerified',
        'user.createdAt',
        'user.updatedAt',
      ])
      .loadRelationCountAndMap('user.ordersCount', 'user.orders')

    if (search) {
      query.andWhere(
        '(user.email ILIKE :search OR user.phone ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
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

  // Profile management methods

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.findOne(userId)
    if (!user) {
      throw new NotFoundException('Користувача не знайдено')
    }

    const { passwordHash, passwordResetToken, passwordResetExpires,
      emailVerificationToken, emailVerificationExpires,
      pendingEmailToken, pendingEmailExpires,
      phoneVerificationCode, phoneVerificationExpires,
      pendingPhoneCode, pendingPhoneExpires,
      ...safeUser } = user

    return safeUser
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.findOne(userId)
    if (!user) {
      throw new NotFoundException('Користувача не знайдено')
    }

    const updateData: Partial<User> = {}

    if (updateProfileDto.firstName !== undefined) {
      updateData.firstName = updateProfileDto.firstName || null
    }
    if (updateProfileDto.lastName !== undefined) {
      updateData.lastName = updateProfileDto.lastName || null
    }
    if (updateProfileDto.dateOfBirth !== undefined) {
      updateData.dateOfBirth = updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth) : null
    }

    await this.usersRepository.update(userId, updateData)
    return this.getProfile(userId)
  }

  async requestEmailChange(userId: string, changeEmailDto: ChangeEmailDto): Promise<{ message: string }> {
    const user = await this.findOne(userId)
    if (!user) {
      throw new NotFoundException('Користувача не знайдено')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changeEmailDto.currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний поточний пароль')
    }

    // Check if new email is already in use
    const existingUser = await this.findByEmail(changeEmailDto.newEmail)
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Ця електронна адреса вже використовується')
    }

    // Check if email is the same
    if (user.email === changeEmailDto.newEmail) {
      throw new BadRequestException('Нова адреса збігається з поточною')
    }

    // Generate verification token
    const pendingEmailToken = this.generateToken()
    const pendingEmailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await this.usersRepository.update(userId, {
      pendingEmail: changeEmailDto.newEmail,
      pendingEmailToken,
      pendingEmailExpires,
    })

    // Send verification email to the new address
    await this.emailService.sendEmailChangeVerification(
      user.email,
      changeEmailDto.newEmail,
      pendingEmailToken
    )

    return { message: 'Лист для підтвердження відправлено на нову адресу' }
  }

  async verifyEmailChange(token: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: {
        pendingEmailToken: token,
        pendingEmailExpires: MoreThan(new Date()),
      },
    })

    if (!user) {
      throw new BadRequestException('Невірний або прострочений токен підтвердження')
    }

    if (!user.pendingEmail) {
      throw new BadRequestException('Немає запиту на зміну електронної пошти')
    }

    // Update email
    await this.usersRepository.update(user.id, {
      email: user.pendingEmail,
      emailVerified: true,
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpires: null,
    })

    return { message: 'Електронну пошту успішно змінено' }
  }

  async requestPhoneChange(userId: string, changePhoneDto: ChangePhoneDto): Promise<{ message: string }> {
    const user = await this.findOne(userId)
    if (!user) {
      throw new NotFoundException('Користувача не знайдено')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePhoneDto.currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний поточний пароль')
    }

    // Check if phone is the same
    if (user.phone === changePhoneDto.newPhone) {
      throw new BadRequestException('Новий номер телефону збігається з поточним')
    }

    // Generate verification code
    const pendingPhoneCode = this.generateCode()
    const pendingPhoneExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await this.usersRepository.update(userId, {
      pendingPhone: changePhoneDto.newPhone,
      pendingPhoneCode,
      pendingPhoneExpires,
    })

    // Send SMS verification code
    await this.smsService.sendVerificationCode(changePhoneDto.newPhone, pendingPhoneCode)

    return { message: 'Код підтвердження відправлено на новий номер телефону' }
  }

  async verifyPhoneChange(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
        pendingPhoneExpires: MoreThan(new Date()),
      },
    })

    if (!user) {
      throw new BadRequestException('Сесія підтвердження прострочена. Запросіть новий код.')
    }

    if (!user.pendingPhone || !user.pendingPhoneCode) {
      throw new BadRequestException('Немає запиту на зміну номера телефону')
    }

    if (user.pendingPhoneCode !== code) {
      throw new BadRequestException('Невірний код підтвердження')
    }

    // Notify old phone about the change (if exists)
    if (user.phone) {
      await this.smsService.sendPhoneChangeNotification(user.phone)
    }

    // Update phone
    await this.usersRepository.update(user.id, {
      phone: user.pendingPhone,
      phoneVerified: true,
      pendingPhone: null,
      pendingPhoneCode: null,
      pendingPhoneExpires: null,
    })

    return { message: 'Номер телефону успішно змінено' }
  }

  async resendPhoneCode(userId: string): Promise<{ message: string }> {
    const user = await this.findOne(userId)
    if (!user) {
      throw new NotFoundException('Користувача не знайдено')
    }

    if (!user.pendingPhone) {
      throw new BadRequestException('Немає запиту на зміну номера телефону')
    }

    // Generate new code
    const pendingPhoneCode = this.generateCode()
    const pendingPhoneExpires = new Date(Date.now() + 10 * 60 * 1000)

    await this.usersRepository.update(userId, {
      pendingPhoneCode,
      pendingPhoneExpires,
    })

    await this.smsService.sendVerificationCode(user.pendingPhone, pendingPhoneCode)

    return { message: 'Новий код підтвердження відправлено' }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.findOne(userId)
    if (!user) {
      throw new NotFoundException('Користувача не знайдено')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний поточний пароль')
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.passwordHash)
    if (isSamePassword) {
      throw new BadRequestException('Новий пароль повинен відрізнятися від поточного')
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10)

    await this.usersRepository.update(userId, {
      passwordHash: newPasswordHash,
    })

    return { message: 'Пароль успішно змінено' }
  }

  async findByPendingEmailToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        pendingEmailToken: token,
        pendingEmailExpires: MoreThan(new Date()),
      },
    })
  }
}
