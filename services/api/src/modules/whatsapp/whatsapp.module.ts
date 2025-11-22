import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WhatsAppService } from './whatsapp.service'
import { WhatsAppController } from './whatsapp.controller'
import { WhatsAppUser } from '../../database/entities/whatsapp-user.entity'
import { User } from '../../database/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppUser, User])],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
