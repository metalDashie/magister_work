import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from '../../database/entities'
import { NotificationChannel, NotificationStatus } from '@fullmag/common'
import { firstValueFrom } from 'rxjs'
import { TelegramService } from '../telegram/telegram.service'

@Processor('notifications')
export class NotificationsProcessor {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private configService: ConfigService,
    private httpService: HttpService,
    private telegramService: TelegramService
  ) {}

  @Process('send')
  async handleSend(job: Job) {
    const { notificationId, channel, userId, template, data } = job.data

    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(data)
          break
        case NotificationChannel.SMS:
          await this.sendSMS(data)
          break
        case NotificationChannel.TELEGRAM:
          await this.sendTelegram(data)
          break
      }

      await this.notificationsRepository.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      })
    } catch (error) {
      await this.notificationsRepository.update(notificationId, {
        status: NotificationStatus.FAILED,
      })
      console.error('Notification failed:', error)
    }
  }

  private async sendEmail(data: any) {
    const sendgridKey = this.configService.get('SENDGRID_API_KEY')
    // SendGrid implementation
    console.log('Sending email:', data)
  }

  private async sendSMS(data: any) {
    const turbosmsKey = this.configService.get('TURBOSMS_API_KEY')
    // TurboSMS implementation
    console.log('Sending SMS:', data)
  }

  private async sendTelegram(data: any) {
    // Use TelegramService to send the message
    const { userId, message } = data

    if (userId && message) {
      const sent = await this.telegramService.sendPersonalMessage({
        userId,
        message,
      })

      if (!sent) {
        throw new Error('Failed to send Telegram message')
      }
    } else {
      console.log('Sending Telegram:', data)
    }
  }
}
