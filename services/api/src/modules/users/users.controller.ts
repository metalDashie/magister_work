import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@fullmag/common'
import { UsersService } from './users.service'
import {
  UpdateProfileDto,
  ChangeEmailDto,
  VerifyEmailChangeDto,
  ChangePhoneDto,
  VerifyPhoneChangeDto,
  ChangePasswordDto,
} from './dto'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ==================== Profile Management (must be before :id routes) ====================

  /**
   * Get current user profile
   * GET /users/me
   */
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId)
  }

  /**
   * Update current user profile (name, dateOfBirth)
   * PATCH /users/me
   */
  @Patch('me')
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto)
  }

  /**
   * Request email change - sends verification to new email
   * POST /users/me/change-email
   */
  @Post('me/change-email')
  async requestEmailChange(
    @Request() req: any,
    @Body() changeEmailDto: ChangeEmailDto,
  ) {
    return this.usersService.requestEmailChange(req.user.userId, changeEmailDto)
  }

  /**
   * Verify email change with token (no auth required - from email link)
   * POST /users/verify-email-change
   */
  @Post('verify-email-change')
  async verifyEmailChange(@Body() verifyDto: VerifyEmailChangeDto) {
    return this.usersService.verifyEmailChange(verifyDto.token)
  }

  /**
   * Request phone change - sends SMS code to new number
   * POST /users/me/change-phone
   */
  @Post('me/change-phone')
  async requestPhoneChange(
    @Request() req: any,
    @Body() changePhoneDto: ChangePhoneDto,
  ) {
    return this.usersService.requestPhoneChange(req.user.userId, changePhoneDto)
  }

  /**
   * Verify phone change with SMS code
   * POST /users/me/verify-phone
   */
  @Post('me/verify-phone')
  async verifyPhoneChange(
    @Request() req: any,
    @Body() verifyDto: VerifyPhoneChangeDto,
  ) {
    return this.usersService.verifyPhoneChange(req.user.userId, verifyDto.code)
  }

  /**
   * Resend phone verification SMS code
   * POST /users/me/resend-phone-code
   */
  @Post('me/resend-phone-code')
  async resendPhoneCode(@Request() req: any) {
    return this.usersService.resendPhoneCode(req.user.userId)
  }

  /**
   * Change password
   * POST /users/me/change-password
   */
  @Post('me/change-password')
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto)
  }

  // ==================== Admin Routes ====================

  /**
   * Get all users (Admin only)
   * GET /users?search=xxx&role=xxx
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAllAdmin(search, role)
  }

  /**
   * Get user statistics (Admin only)
   * GET /users/stats
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats() {
    return this.usersService.getStats()
  }

  /**
   * Get single user by ID
   * GET /users/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  /**
   * Update user role (Admin only)
   * PATCH /users/:id/role
   */
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.usersService.updateRole(id, role)
  }

  /**
   * Delete user (Admin only)
   * DELETE /users/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id)
  }
}
