import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { PaymentsService } from '../payments/payments.service'
import { OrdersService } from '../orders/orders.service'
import { PaymentStatus, OrderStatus } from '@fullmag/common'

@Controller('webhook')
export class WebhookController {
  constructor(
    private paymentsService: PaymentsService,
    private ordersService: OrdersService
  ) {}

  @Post('monobank')
  @HttpCode(200)
  async handleMonobankWebhook(@Body() payload: any) {
    try {
      const { invoiceId, status, amount } = payload

      // Update payment status
      let paymentStatus: PaymentStatus
      let orderStatus: OrderStatus

      if (status === 'success') {
        paymentStatus = PaymentStatus.SUCCESS
        orderStatus = OrderStatus.PAID
      } else if (status === 'failure') {
        paymentStatus = PaymentStatus.FAILED
        orderStatus = OrderStatus.CANCELLED
      } else {
        paymentStatus = PaymentStatus.PENDING
        orderStatus = OrderStatus.PENDING
      }

      await this.paymentsService.updatePaymentStatus(invoiceId, paymentStatus)

      // Find payment and update order
      const payment = await this.paymentsService.findByProviderPaymentId(invoiceId)
      if (payment) {
        await this.ordersService.updateStatus(payment.orderId, orderStatus)
      }

      return { status: 'ok' }
    } catch (error) {
      console.error('Webhook error:', error)
      return { status: 'error' }
    }
  }

  @Post('telegram')
  @HttpCode(200)
  async handleTelegramWebhook(@Body() update: any) {
    // Handle Telegram bot updates
    console.log('Telegram update:', update)
    return { status: 'ok' }
  }
}
