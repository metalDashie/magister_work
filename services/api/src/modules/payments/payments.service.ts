import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { Payment } from '../../database/entities'
import { PaymentProvider, PaymentStatus } from '@fullmag/common'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async createInvoice(orderId: string, amount: number, currency: string) {
    const monobankToken = this.configService.get('MONOBANK_TOKEN')
    const monobankUrl = this.configService.get('MONOBANK_API_URL')

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${monobankUrl}/merchant/invoice/create`,
          {
            amount: Math.round(amount * 100), // Convert to cents
            ccy: currency === 'UAH' ? 980 : 840,
            merchantPaymInfo: {
              reference: orderId,
            },
          },
          {
            headers: {
              'X-Token': monobankToken,
            },
          }
        )
      )

      const payment = this.paymentsRepository.create({
        orderId,
        provider: PaymentProvider.MONOBANK,
        providerPaymentId: response.data.invoiceId,
        status: PaymentStatus.PENDING,
        amount,
        currency,
      })

      await this.paymentsRepository.save(payment)

      return {
        invoiceId: response.data.invoiceId,
        pageUrl: response.data.pageUrl,
      }
    } catch (error) {
      console.error('Monobank payment error:', error)
      throw new Error('Failed to create payment invoice')
    }
  }

  async updatePaymentStatus(
    providerPaymentId: string,
    status: PaymentStatus
  ): Promise<void> {
    await this.paymentsRepository.update(
      { providerPaymentId },
      { status }
    )
  }

  async findByProviderPaymentId(providerPaymentId: string): Promise<Payment> {
    return this.paymentsRepository.findOne({
      where: { providerPaymentId },
      relations: ['order'],
    })
  }
}
