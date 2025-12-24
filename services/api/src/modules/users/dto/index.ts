import { IsString, IsOptional, IsEmail, MinLength, Matches } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  dateOfBirth?: string
}

export class ChangeEmailDto {
  @IsString()
  currentPassword: string

  @IsEmail()
  newEmail: string
}

export class ChangePhoneDto {
  @IsString()
  currentPassword: string

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  newPhone: string
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string

  @IsString()
  @MinLength(8)
  newPassword: string
}

export class VerifyEmailChangeDto {
  @IsString()
  token: string
}

export class VerifyPhoneChangeDto {
  @IsString()
  code: string
}
