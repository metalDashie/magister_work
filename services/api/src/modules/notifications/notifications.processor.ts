import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from '../../database/entities'
import { NotificationChannel, NotificationStatus } from '@fullmag/common'
import { firstValueFrom } from 'rxjs'

@Processor('notifications')
export class NotificationsProcessor {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private configService: ConfigService,
    private httpService: HttpService
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
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN')
    // Telegram Bot API implementation
    console.log('Sending Telegram:', data)
  }
}
