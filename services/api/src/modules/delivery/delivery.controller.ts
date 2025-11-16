import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { NovaPoshtaService } from './nova-poshta.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private novaPoshtaService: NovaPoshtaService) {}

  @Get('cities/search')
  async searchCities(@Query('query') query: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20
    const result = await this.novaPoshtaService.searchCities(query, limitNum)

    // Transform response to simplified format
    if (result && result[0]?.Addresses) {
      return result[0].Addresses.map((item: any) => ({
        ref: item.DeliveryCity,
        mainDescription: item.MainDescription,
        area: item.Area,
        region: item.Region,
        settlementTypeCode: item.SettlementTypeCode,
        fullDescription: `${item.MainDescription}, ${item.Area}`,
      }))
    }

    return []
  }

  @Get('warehouses')
  async getWarehouses(
    @Query('cityRef') cityRef: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1
    const limitNum = limit ? parseInt(limit) : 50

    const warehouses = await this.novaPoshtaService.getWarehouses(
      cityRef,
      pageNum,
      limitNum
    )

    // Transform response to simplified format
    return warehouses.map((warehouse: any) => ({
      ref: warehouse.Ref,
      description: warehouse.Description,
      descriptionRu: warehouse.DescriptionRu,
      shortAddress: warehouse.ShortAddress,
      shortAddressRu: warehouse.ShortAddressRu,
      number: warehouse.Number,
      cityRef: warehouse.CityRef,
      cityDescription: warehouse.CityDescription,
      settlementRef: warehouse.SettlementRef,
      settlementDescription: warehouse.SettlementDescription,
      totalMaxWeightAllowed: warehouse.TotalMaxWeightAllowed,
      placeMaxWeightAllowed: warehouse.PlaceMaxWeightAllowed,
      reception: warehouse.Reception,
      delivery: warehouse.Delivery,
      schedule: warehouse.Schedule,
    }))
  }

  @Get('streets/search')
  async searchStreets(
    @Query('cityRef') cityRef: string,
    @Query('query') query: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 20
    const streets = await this.novaPoshtaService.searchStreets(
      cityRef,
      query,
      limitNum
    )

    // Transform response
    return streets.map((street: any) => ({
      ref: street.Ref,
      description: street.Description,
      settlementRef: street.SettlementRef,
      settlementDescription: street.Present,
    }))
  }

  @Get('calculate')
  async calculateDelivery(
    @Query('citySender') citySender: string,
    @Query('cityRecipient') cityRecipient: string,
    @Query('weight') weight: string,
    @Query('cost') cost: string,
    @Query('serviceType') serviceType?: string
  ) {
    const service = serviceType || 'WarehouseWarehouse'
    return this.novaPoshtaService.calculateDelivery(
      citySender,
      cityRecipient,
      service,
      parseFloat(weight),
      parseFloat(cost)
    )
  }

  @Get('delivery-time')
  async getDeliveryTime(
    @Query('citySender') citySender: string,
    @Query('cityRecipient') cityRecipient: string,
    @Query('serviceType') serviceType?: string
  ) {
    return this.novaPoshtaService.getDeliveryTime(
      citySender,
      cityRecipient,
      serviceType
    )
  }
}
