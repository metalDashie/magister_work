import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common'
import { Request } from 'express'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get Stripe publishable key for frontend
   */
  @Get('config')
  getConfig() {
    return {
      publishableKey: this.paymentsService.getPublishableKey(),
    }
  }

  /**
   * Create a payment intent for an order
   */
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Body() body: { orderId: string },
    @Req() req: any,
  ) {
    return this.paymentsService.createPaymentIntent(body.orderId, req.user.id)
  }

  /**
   * Confirm payment after frontend processing
   */
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Body() body: { paymentIntentId: string }) {
    return this.paymentsService.confirmPayment(body.paymentIntentId)
  }

  /**
   * Get payment status for an order
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(orderId)
  }

  /**
   * Stripe webhook handler
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody
    if (!payload) {
      return { received: false, error: 'No payload' }
    }

    await this.paymentsService.handleWebhook(signature, payload)
    return { received: true }
  }
}
