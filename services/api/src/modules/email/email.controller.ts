import { Controller, Post, Body, Get } from '@nestjs/common'
import { IsEmail, IsIn } from 'class-validator'
import { EmailService } from './email.service'

class TestEmailDto {
  @IsEmail()
  email: string

  @IsIn(['welcome', 'order-confirmation', 'order-status-update', 'payment-success', 'password-reset', 'email-verification', 'cart-reminder', 'all'])
  template: 'welcome' | 'order-confirmation' | 'order-status-update' | 'payment-success' | 'password-reset' | 'email-verification' | 'cart-reminder' | 'all'
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  async sendTestEmail(@Body() dto: TestEmailDto) {
    const { email, template } = dto
    const results: Record<string, boolean> = {}

    const testData = {
      name: 'Олександр Петренко',
      orderNumber: 'FM-2024-7842',
      orderId: 'a3b8c9d2-e5f6-4a1b-8c3d-9e0f1a2b3c4d',
      items: [
        { name: 'Samsung Galaxy S24 Ultra 256GB', quantity: 1, price: '52 999 ₴', total: '52 999 ₴' },
        { name: 'Чохол Samsung Silicone Cover', quantity: 1, price: '1 299 ₴', total: '1 299 ₴' },
        { name: 'Захисне скло Premium Glass', quantity: 2, price: '499 ₴', total: '998 ₴' },
      ],
      totalAmount: '55 296 ₴',
      frontendUrl: 'http://localhost:10002',
    }

    if (template === 'all' || template === 'welcome') {
      results['welcome'] = await this.emailService.sendWelcomeEmail(email, testData.name)
    }

    if (template === 'all' || template === 'order-confirmation') {
      results['order-confirmation'] = await this.emailService.sendEmail({
        to: email,
        subject: `Підтвердження замовлення №${testData.orderNumber}`,
        template: 'order-confirmation',
        context: {
          orderNumber: testData.orderNumber,
          orderId: testData.orderId,
          items: testData.items,
          totalAmount: testData.totalAmount,
          deliveryCity: 'Київ',
          deliveryWarehouse: 'Відділення №15: вул. Хрещатик, 22',
          recipientName: testData.name,
          recipientPhone: '+380 67 123 45 67',
          orderDate: new Date().toLocaleDateString('uk-UA'),
          year: new Date().getFullYear(),
        },
      })
    }

    if (template === 'all' || template === 'order-status-update') {
      results['order-status-update'] = await this.emailService.sendEmail({
        to: email,
        subject: `Оновлення статусу замовлення №${testData.orderNumber}`,
        template: 'order-status-update',
        context: {
          orderNumber: testData.orderNumber,
          orderId: testData.orderId,
          oldStatus: 'В обробці',
          newStatus: 'Відправлено',
          totalAmount: testData.totalAmount,
          year: new Date().getFullYear(),
        },
      })
    }

    if (template === 'all' || template === 'payment-success') {
      results['payment-success'] = await this.emailService.sendEmail({
        to: email,
        subject: `Оплата успішна - Замовлення №${testData.orderNumber}`,
        template: 'payment-success',
        context: {
          orderNumber: testData.orderNumber,
          orderId: testData.orderId,
          paymentId: 'pi_3QfK8mIaSGLNaJ8H1a2b3c4d',
          totalAmount: testData.totalAmount,
          paymentDate: new Date().toLocaleDateString('uk-UA'),
          year: new Date().getFullYear(),
        },
      })
    }

    if (template === 'all' || template === 'password-reset') {
      results['password-reset'] = await this.emailService.sendEmail({
        to: email,
        subject: 'Скидання пароля - FullMag',
        template: 'password-reset',
        context: {
          resetUrl: `${testData.frontendUrl}/auth/reset-password?token=test-reset-token`,
          expiryMinutes: 60,
          year: new Date().getFullYear(),
        },
      })
    }

    if (template === 'all' || template === 'email-verification') {
      results['email-verification'] = await this.emailService.sendEmail({
        to: email,
        subject: 'Підтвердіть вашу електронну пошту - FullMag',
        template: 'email-verification',
        context: {
          name: testData.name,
          verificationUrl: `${testData.frontendUrl}/auth/verify-email?token=test-verification-token`,
          expiryHours: 24,
          year: new Date().getFullYear(),
        },
      })
    }

    if (template === 'all' || template === 'cart-reminder') {
      results['cart-reminder'] = await this.emailService.sendAbandonedCartReminder(
        email,
        testData.name,
        testData.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        testData.totalAmount,
        `${testData.frontendUrl}/cart`,
        'WELCOME15',
        15
      )
    }

    return {
      success: true,
      message: 'Test emails sent',
      results,
    }
  }

  @Get('templates')
  async listTemplates() {
    return {
      templates: [
        { id: 'welcome', name: 'Welcome Email', description: 'Sent when user registers' },
        { id: 'order-confirmation', name: 'Order Confirmation', description: 'Sent after order is placed' },
        { id: 'order-status-update', name: 'Order Status Update', description: 'Sent when order status changes' },
        { id: 'payment-success', name: 'Payment Success', description: 'Sent after successful payment' },
        { id: 'password-reset', name: 'Password Reset', description: 'Sent for password reset request' },
        { id: 'email-verification', name: 'Email Verification', description: 'Sent to verify email address' },
        { id: 'cart-reminder', name: 'Cart Reminder', description: 'Sent for abandoned carts' },
      ],
    }
  }
}
