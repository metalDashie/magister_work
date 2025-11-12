import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { HttpModule } from '@nestjs/axios'
import { Notification } from '../../database/entities'
import { NotificationsService } from './notifications.service'
import { NotificationsProcessor } from './notifications.processor'

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    HttpModule,
  ],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
