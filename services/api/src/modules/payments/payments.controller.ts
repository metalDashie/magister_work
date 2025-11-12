import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('invoice')
  @UseGuards(JwtAuthGuard)
  createInvoice(
    @Body() body: { orderId: string; amount: number; currency: string }
  ) {
    return this.paymentsService.createInvoice(
      body.orderId,
      body.amount,
      body.currency
    )
  }
}
