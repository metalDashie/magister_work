import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name)

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    // TODO: Implement actual SMS sending via provider (e.g., Twilio, Nexmo)
    this.logger.log(`[SMS STUB] Sending verification code ${code} to ${phone}`)
  }

  async sendPhoneChangeNotification(phone: string): Promise<void> {
    // TODO: Implement actual SMS sending
    this.logger.log(`[SMS STUB] Sending phone change notification to ${phone}`)
  }

  async sendSms(phone: string, message: string): Promise<void> {
    // TODO: Implement actual SMS sending
    this.logger.log(`[SMS STUB] Sending SMS to ${phone}: ${message}`)
  }
}
