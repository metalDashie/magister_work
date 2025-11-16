'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Warehouse {
  ref: string
  description: string
  shortAddress: string
  number: string
}

interface WarehouseSelectProps {
  cityRef: string | null
  value: Warehouse | null
  onChange: (warehouse: Warehouse | null) => void
  error?: string
}

export function WarehouseSelect({
  cityRef,
  value,
  onChange,
  error,
}: WarehouseSelectProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!cityRef) {
      setWarehouses([])
      onChange(null)
      return
    }

    const fetchWarehouses = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/delivery/warehouses', {
          params: { cityRef, limit: 100 },
        })
        setWarehouses(response.data)
      } catch (error) {
        console.error('Failed to fetch warehouses:', error)
        setWarehouses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWarehouses()
  }, [cityRef])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRef = e.target.value
    if (!selectedRef) {
      onChange(null)
      return
    }

    const selectedWarehouse = warehouses.find((w) => w.ref === selectedRef)
    if (selectedWarehouse) {
      onChange(selectedWarehouse)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Відділення Нової Пошти
      </label>
      <select
        value={value?.ref || ''}
        onChange={handleChange}
        disabled={!cityRef || isLoading}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${!cityRef || isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">
          {isLoading
            ? 'Завантаження...'
            : !cityRef
            ? 'Спочатку оберіть місто'
            : 'Оберіть відділення'}
        </option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.ref} value={warehouse.ref}>
            {warehouse.description}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
