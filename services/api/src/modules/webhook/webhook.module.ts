import { Module } from '@nestjs/common'
import { WebhookController } from './webhook.controller'
import { PaymentsModule } from '../payments/payments.module'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [PaymentsModule, OrdersModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
