import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

interface NovaPoshtaRequest {
  apiKey: string
  modelName: string
  calledMethod: string
  methodProperties: any
}

@Injectable()
export class NovaPoshtaService {
  private readonly apiUrl = 'https://api.novaposhta.ua/v2.0/json/'
  private readonly apiKey: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.apiKey = this.configService.get('NOVA_POSHTA_API_KEY') || ''
  }

  private async makeRequest(
    modelName: string,
    calledMethod: string,
    methodProperties: any = {}
  ): Promise<any> {
    const requestData: NovaPoshtaRequest = {
      apiKey: this.apiKey,
      modelName,
      calledMethod,
      methodProperties,
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, requestData)
      )

      if (!response.data.success) {
        throw new Error(
          response.data.errors?.[0] || 'Nova Poshta API request failed'
        )
      }

      return response.data.data
    } catch (error) {
      console.error('Nova Poshta API error:', error)
      throw error
    }
  }

  /**
   * Search cities by name
   */
  async searchCities(cityName: string, limit: number = 20): Promise<any[]> {
    return this.makeRequest('Address', 'searchSettlements', {
      CityName: cityName,
      Limit: limit,
    })
  }

  /**
   * Get city by reference
   */
  async getCityByRef(cityRef: string): Promise<any> {
    const cities = await this.makeRequest('Address', 'getCities', {
      Ref: cityRef,
    })
    return cities[0]
  }

  /**
   * Get warehouses (branches) by city
   */
  async getWarehouses(
    cityRef: string,
    page: number = 1,
    limit: number = 50
  ): Promise<any[]> {
    return this.makeRequest('Address', 'getWarehouses', {
      CityRef: cityRef,
      Page: page.toString(),
      Limit: limit.toString(),
      Language: 'UA',
    })
  }

  /**
   * Get warehouse by reference
   */
  async getWarehouseByRef(warehouseRef: string): Promise<any> {
    const warehouses = await this.makeRequest('Address', 'getWarehouses', {
      Ref: warehouseRef,
    })
    return warehouses[0]
  }

  /**
   * Search streets in city
   */
  async searchStreets(
    cityRef: string,
    streetName: string,
    limit: number = 20
  ): Promise<any[]> {
    return this.makeRequest('Address', 'searchSettlementStreets', {
      StreetName: streetName,
      SettlementRef: cityRef,
      Limit: limit,
    })
  }

  /**
   * Calculate delivery cost
   */
  async calculateDelivery(
    citySender: string,
    cityRecipient: string,
    serviceType: string,
    weight: number,
    cost: number
  ): Promise<any> {
    return this.makeRequest('InternetDocument', 'getDocumentPrice', {
      CitySender: citySender,
      CityRecipient: cityRecipient,
      ServiceType: serviceType, // WarehouseWarehouse, WarehouseDoors, DoorsWarehouse, DoorsDoors
      Weight: weight.toString(),
      Cost: cost.toString(),
    })
  }

  /**
   * Get delivery time
   */
  async getDeliveryTime(
    citySender: string,
    cityRecipient: string,
    serviceType: string = 'WarehouseWarehouse'
  ): Promise<any> {
    return this.makeRequest('InternetDocument', 'getDocumentDeliveryDate', {
      CitySender: citySender,
      CityRecipient: cityRecipient,
      ServiceType: serviceType,
    })
  }
}
