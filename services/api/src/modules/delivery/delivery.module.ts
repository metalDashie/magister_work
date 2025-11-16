import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { NovaPoshtaService } from './nova-poshta.service'
import { DeliveryController } from './delivery.controller'

@Module({
  imports: [HttpModule],
  controllers: [DeliveryController],
  providers: [NovaPoshtaService],
  exports: [NovaPoshtaService],
})
export class DeliveryModule {}
