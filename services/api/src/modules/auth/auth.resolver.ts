import { Resolver, Mutation, Args } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { CreateUserDto, LoginDto } from '@fullmag/common'

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => String)
  async login(@Args('input') loginDto: LoginDto) {
    const result = await this.authService.login(loginDto)
    return JSON.stringify(result)
  }

  @Mutation(() => String)
  async register(@Args('input') createUserDto: CreateUserDto) {
    const result = await this.authService.register(createUserDto)
    return JSON.stringify(result)
  }
}
