import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CreateUserDto, LoginDto } from '@fullmag/common'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto)
  }
}
