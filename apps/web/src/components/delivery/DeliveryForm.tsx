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

export interface DeliveryFormData {
  deliveryType: 'nova_poshta_warehouse'
  cityRef: string
  cityName: string
  warehouseRef: string
  warehouseDescription: string
  recipientName: string
  recipientPhone: string
}

interface DeliveryFormProps {
  onDataChange: (data: DeliveryFormData | null) => void
  initialName?: string
  initialPhone?: string
}

export function DeliveryForm({ onDataChange, initialName = '', initialPhone = '' }: DeliveryFormProps) {
  const [city, setCity] = useState<City | null>(null)
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [recipientName, setRecipientName] = useState(initialName)
  const [recipientPhone, setRecipientPhone] = useState(initialPhone)
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null)
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate form and update parent component
  useEffect(() => {
    const newErrors: Record<string, string> = {}

    if (!city) {
      newErrors.city = 'Оберіть місто доставки'
    }

    if (!warehouse) {
      newErrors.warehouse = 'Оберіть відділення'
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
    if (Object.keys(newErrors).length === 0 && city && warehouse) {
      onDataChange({
        deliveryType: 'nova_poshta_warehouse',
        cityRef: city.ref,
        cityName: city.mainDescription,
        warehouseRef: warehouse.ref,
        warehouseDescription: warehouse.description,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
      })
    } else {
      onDataChange(null)
    }
  }, [city, warehouse, recipientName, recipientPhone, onDataChange])

  // Calculate delivery cost and time when city is selected
  useEffect(() => {
    if (!city) {
      setDeliveryCost(null)
      setDeliveryTime(null)
      return
    }

    const calculateDelivery = async () => {
      setIsCalculating(true)
      try {
        // Get sender city from config (you can make this configurable)
        const senderCityRef = process.env.NEXT_PUBLIC_SENDER_CITY_REF || city.ref

        const [costResponse, timeResponse] = await Promise.all([
          api.get('/delivery/calculate', {
            params: {
              citySender: senderCityRef,
              cityRecipient: city.ref,
              weight: '1', // Default weight
              cost: '1000', // Default cost for calculation
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
  }, [city])

  return (
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ім&apos;я одержувача
        </label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Прізвище Ім'я По батькові"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.recipientPhone ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.recipientPhone && (
          <p className="mt-1 text-sm text-red-500">{errors.recipientPhone}</p>
        )}
      </div>

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
  )
}
