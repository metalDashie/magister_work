import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../../database/entities'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { UsersResolver } from './users.resolver'
import { EmailModule } from '../email/email.module'
import { SmsModule } from '../sms/sms.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,
    SmsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
