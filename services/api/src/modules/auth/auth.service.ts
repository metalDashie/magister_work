import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { UsersService } from '../users/users.service'
import { CreateUserDto, LoginDto } from '@fullmag/common'
import { EmailService } from '../email/email.service'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {}

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email)
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user
      return result
    }
    return null
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = { email: user.email, sub: user.id, role: user.role }
    return {
      access_token: this.jwtService.sign(payload),
      user,
    }
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email)
    if (existingUser) {
      throw new BadRequestException('User with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    const emailVerificationToken = this.generateToken()
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const user = await this.usersService.create({
      ...createUserDto,
      passwordHash: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires,
      emailVerified: false,
    })

    const { passwordHash, ...result } = user
    const payload = { email: result.email, sub: result.id, role: result.role }

    // Send email verification
    await this.emailService.sendEmailVerification(
      result.email,
      result.email.split('@')[0],
      emailVerificationToken
    )

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
      message: 'Registration successful. Please check your email to verify your account.',
    }
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByEmailVerificationToken(token)
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token')
    }

    await this.usersService.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    })

    // Send welcome email after verification
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.email.split('@')[0]
    )

    return { message: 'Email verified successfully' }
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified')
    }

    const emailVerificationToken = this.generateToken()
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await this.usersService.update(user.id, {
      emailVerificationToken,
      emailVerificationExpires,
    })

    await this.emailService.sendEmailVerification(
      user.email,
      user.email.split('@')[0],
      emailVerificationToken
    )

    return { message: 'Verification email sent' }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a password reset link will be sent' }
    }

    const passwordResetToken = this.generateToken()
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await this.usersService.update(user.id, {
      passwordResetToken,
      passwordResetExpires,
    })

    await this.emailService.sendPasswordResetEmail(user.email, passwordResetToken)

    return { message: 'If the email exists, a password reset link will be sent' }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByPasswordResetToken(token)
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await this.usersService.update(user.id, {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    })

    return { message: 'Password reset successfully' }
  }
}
