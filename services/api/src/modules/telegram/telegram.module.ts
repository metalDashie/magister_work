import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TelegramService } from './telegram.service'
import { TelegramController } from './telegram.controller'
import { TelegramUser } from '../../database/entities/telegram-user.entity'
import { User } from '../../database/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TelegramUser, User])],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
