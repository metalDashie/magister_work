import { Resolver, Query, Args } from '@nestjs/graphql'
import { UsersService } from './users.service'

@Resolver()
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => String)
  async users() {
    const users = await this.usersService.findAll()
    return JSON.stringify(users)
  }

  @Query(() => String)
  async user(@Args('id') id: string) {
    const user = await this.usersService.findOne(id)
    return JSON.stringify(user)
  }
}
