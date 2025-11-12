import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectQueue } from '@nestjs/bull'
import { Repository } from 'typeorm'
import { Queue } from 'bull'
import { Notification } from '../../database/entities'
import { NotificationChannel, SendNotificationDto } from '@fullmag/common'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue
  ) {}

  async send(sendNotificationDto: SendNotificationDto): Promise<void> {
    const notification = this.notificationsRepository.create({
      ...sendNotificationDto,
      payload: sendNotificationDto.data,
    })

    const savedNotification = await this.notificationsRepository.save(notification)

    // Add to queue for async processing
    await this.notificationsQueue.add('send', {
      notificationId: savedNotification.id,
      ...sendNotificationDto,
    })
  }
}
