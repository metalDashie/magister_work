'use client'

import { useState, useEffect } from 'react'
import { CitySearch } from './CitySearch'
import { WarehouseSelect } from './WarehouseSelect'
import { api } from '@/lib/api'

interface City {
  ref: string
  mainDescription: string
  area: string
  region: string
  fullDescription: string
}

interface Warehouse {
  ref: string
  description: string
  shortAddress: string
  number: string
}

type DeliveryType = 'pickup' | 'nova_poshta_warehouse'

interface PickupPoint {
  id: string
  name: string
  address: string
  city: string
  workingHours: string
  phone?: string
}

// Store pickup points - can be moved to API/config later
const PICKUP_POINTS: PickupPoint[] = [
  {
    id: 'pickup-1',
    name: 'Головний магазин',
    address: 'вул. Хрещатик, 22',
    city: 'Київ',
    workingHours: 'Пн-Пт: 9:00-20:00, Сб-Нд: 10:00-18:00',
    phone: '+380441234567',
  },
  {
    id: 'pickup-2',
    name: 'Магазин на Подолі',
    address: 'вул. Сагайдачного, 15',
    city: 'Київ',
    workingHours: 'Пн-Пт: 10:00-19:00, Сб: 10:00-17:00',
    phone: '+380441234568',
  },
  {
    id: 'pickup-3',
    name: 'ТРЦ Ocean Plaza',
    address: 'вул. Антоновича, 176, 2 поверх',
    city: 'Київ',
    workingHours: 'Щодня: 10:00-22:00',
    phone: '+380441234569',
  },
]

export interface DeliveryFormData {
  deliveryType: DeliveryType
  // For Nova Poshta
  cityRef?: string
  cityName?: string
  warehouseRef?: string
  warehouseDescription?: string
  // For Pickup
  pickupPointId?: string
  pickupPointName?: string
  pickupPointAddress?: string
  // Common
  recipientName: string
  recipientPhone: string
}

interface DeliveryFormProps {
  onDataChange: (data: DeliveryFormData | null) => void
  initialName?: string
  initialPhone?: string
}

export function DeliveryForm({ onDataChange, initialName = '', initialPhone = '' }: DeliveryFormProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('nova_poshta_warehouse')
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null)
  const [city, setCity] = useState<City | null>(null)
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [recipientName, setRecipientName] = useState(initialName)
  const [recipientPhone, setRecipientPhone] = useState(initialPhone)
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null)
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset delivery-specific fields when switching type
  useEffect(() => {
    if (deliveryType === 'pickup') {
      setCity(null)
      setWarehouse(null)
      setDeliveryCost(null)
      setDeliveryTime(null)
    } else {
      setSelectedPickupPoint(null)
    }
  }, [deliveryType])

  // Validate form and update parent component
  useEffect(() => {
    const newErrors: Record<string, string> = {}

    if (deliveryType === 'nova_poshta_warehouse') {
      if (!city) {
        newErrors.city = 'Оберіть місто доставки'
      }
      if (!warehouse) {
        newErrors.warehouse = 'Оберіть відділення'
      }
    } else if (deliveryType === 'pickup') {
      if (!selectedPickupPoint) {
        newErrors.pickupPoint = 'Оберіть пункт самовивозу'
      }
    }

    if (!recipientName.trim()) {
      newErrors.recipientName = "Введіть ім'я одержувача"
    }

    if (!recipientPhone.trim()) {
      newErrors.recipientPhone = 'Введіть телефон одержувача'
    } else if (!/^\+?380\d{9}$/.test(recipientPhone.replace(/\s/g, ''))) {
      newErrors.recipientPhone = 'Неправильний формат телефону (приклад: +380501234567)'
    }

    setErrors(newErrors)

    // If no errors, provide data to parent
    if (Object.keys(newErrors).length === 0) {
      if (deliveryType === 'nova_poshta_warehouse' && city && warehouse) {
        onDataChange({
          deliveryType: 'nova_poshta_warehouse',
          cityRef: city.ref,
          cityName: city.mainDescription,
          warehouseRef: warehouse.ref,
          warehouseDescription: warehouse.description,
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
        })
      } else if (deliveryType === 'pickup' && selectedPickupPoint) {
        onDataChange({
          deliveryType: 'pickup',
          pickupPointId: selectedPickupPoint.id,
          pickupPointName: selectedPickupPoint.name,
          pickupPointAddress: `${selectedPickupPoint.address}, ${selectedPickupPoint.city}`,
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
        })
      } else {
        onDataChange(null)
      }
    } else {
      onDataChange(null)
    }
  }, [deliveryType, city, warehouse, selectedPickupPoint, recipientName, recipientPhone, onDataChange])

  // Calculate delivery cost and time when city is selected (Nova Poshta only)
  useEffect(() => {
    if (deliveryType !== 'nova_poshta_warehouse' || !city) {
      setDeliveryCost(null)
      setDeliveryTime(null)
      return
    }

    const calculateDelivery = async () => {
      setIsCalculating(true)
      try {
        const senderCityRef = process.env.NEXT_PUBLIC_SENDER_CITY_REF || city.ref

        const [costResponse, timeResponse] = await Promise.all([
          api.get('/delivery/calculate', {
            params: {
              citySender: senderCityRef,
              cityRecipient: city.ref,
              weight: '1',
              cost: '1000',
              serviceType: 'WarehouseWarehouse',
            },
          }),
          api.get('/delivery/delivery-time', {
            params: {
              citySender: senderCityRef,
              cityRecipient: city.ref,
              serviceType: 'WarehouseWarehouse',
            },
          }),
        ])

        if (costResponse.data?.Cost) {
          setDeliveryCost(parseFloat(costResponse.data.Cost))
        }

        if (timeResponse.data?.DeliveryDate) {
          const date = timeResponse.data.DeliveryDate.date || timeResponse.data.DeliveryDate
          setDeliveryTime(date)
        }
      } catch (error) {
        console.error('Failed to calculate delivery:', error)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateDelivery()
  }, [deliveryType, city])

  return (
    <div className="space-y-6">
      {/* Delivery Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Спосіб доставки
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pickup Option */}
          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              deliveryType === 'pickup'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center h-5">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  deliveryType === 'pickup'
                    ? 'border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                {deliveryType === 'pickup' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                )}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <svg
                  className={`w-5 h-5 ${deliveryType === 'pickup' ? 'text-primary-600' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className={`font-semibold ${deliveryType === 'pickup' ? 'text-primary-900' : 'text-gray-900'}`}>
                  Самовивіз
                </span>
              </div>
              <p className={`text-sm mt-1 ${deliveryType === 'pickup' ? 'text-primary-700' : 'text-gray-500'}`}>
                Безкоштовно з магазину
              </p>
            </div>
          </button>

          {/* Nova Poshta Option */}
          <button
            type="button"
            onClick={() => setDeliveryType('nova_poshta_warehouse')}
            className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              deliveryType === 'nova_poshta_warehouse'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center h-5">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  deliveryType === 'nova_poshta_warehouse'
                    ? 'border-primary-600'
                    : 'border-gray-300'
                }`}
              >
                {deliveryType === 'nova_poshta_warehouse' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                )}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <svg
                  className={`w-5 h-5 ${deliveryType === 'nova_poshta_warehouse' ? 'text-primary-600' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <span className={`font-semibold ${deliveryType === 'nova_poshta_warehouse' ? 'text-primary-900' : 'text-gray-900'}`}>
                  Нова Пошта
                </span>
              </div>
              <p className={`text-sm mt-1 ${deliveryType === 'nova_poshta_warehouse' ? 'text-primary-700' : 'text-gray-500'}`}>
                Доставка у відділення
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Pickup Point Selection */}
      {deliveryType === 'pickup' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="font-semibold text-green-900">Самовивіз безкоштовний!</h3>
            </div>
            <p className="text-sm text-green-700">
              Оберіть зручний для вас магазин та заберіть замовлення
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пункт самовивозу
            </label>
            <div className="space-y-3">
              {PICKUP_POINTS.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setSelectedPickupPoint(point)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                    selectedPickupPoint?.id === point.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{point.name}</span>
                        {selectedPickupPoint?.id === point.id && (
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {point.address}, {point.city}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {point.workingHours}
                        </span>
                        {point.phone && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {point.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.pickupPoint && (
              <p className="mt-2 text-sm text-red-500">{errors.pickupPoint}</p>
            )}
          </div>
        </div>
      )}

      {/* Nova Poshta Form */}
      {deliveryType === 'nova_poshta_warehouse' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Доставка Новою Поштою</h3>
            <p className="text-sm text-blue-700">
              Оберіть місто та відділення для доставки вашого замовлення
            </p>
          </div>

          <CitySearch value={city} onChange={setCity} error={errors.city} />

          <WarehouseSelect
            cityRef={city?.ref || null}
            value={warehouse}
            onChange={setWarehouse}
            error={errors.warehouse}
          />

          {city && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900">Інформація про доставку:</h4>
              {isCalculating ? (
                <p className="text-sm text-gray-600">Розрахунок вартості...</p>
              ) : (
                <>
                  {deliveryCost !== null && (
                    <p className="text-sm text-gray-700">
                      Орієнтовна вартість доставки:{' '}
                      <span className="font-semibold">{deliveryCost} грн</span>
                    </p>
                  )}
                  {deliveryTime && (
                    <p className="text-sm text-gray-700">
                      Очікувана дата доставки:{' '}
                      <span className="font-semibold">
                        {new Date(deliveryTime).toLocaleDateString('uk-UA')}
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recipient Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Дані одержувача</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ім&apos;я одержувача
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Прізвище Ім'я По батькові"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.recipientName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientName && (
              <p className="mt-1 text-sm text-red-500">{errors.recipientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон одержувача
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+380501234567"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.recipientPhone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientPhone && (
              <p className="mt-1 text-sm text-red-500">{errors.recipientPhone}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
