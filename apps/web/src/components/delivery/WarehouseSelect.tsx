'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [query, setQuery] = useState(value?.description || '')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch all warehouses when city changes
  useEffect(() => {
    if (!cityRef) {
      setWarehouses([])
      setFilteredWarehouses([])
      setQuery('')
      onChange(null)
      return
    }

    const fetchWarehouses = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/delivery/warehouses', {
          params: { cityRef, limit: 500 },
        })
        setWarehouses(response.data)
        setFilteredWarehouses(response.data.slice(0, 20))
      } catch (error) {
        console.error('Failed to fetch warehouses:', error)
        setWarehouses([])
        setFilteredWarehouses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWarehouses()
  }, [cityRef])

  // Reset query when value is cleared externally
  useEffect(() => {
    if (!value) {
      setQuery('')
    }
  }, [value])

  // Filter warehouses based on query
  const filterWarehouses = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredWarehouses(warehouses.slice(0, 20))
      return
    }

    const lowerQuery = searchQuery.toLowerCase()
    const filtered = warehouses.filter((w) => {
      // Search by number (e.g., "1", "25", "100")
      if (w.number && w.number.includes(searchQuery)) {
        return true
      }
      // Search by description
      if (w.description.toLowerCase().includes(lowerQuery)) {
        return true
      }
      // Search by address
      if (w.shortAddress && w.shortAddress.toLowerCase().includes(lowerQuery)) {
        return true
      }
      return false
    })

    // Sort: exact number matches first, then by number
    filtered.sort((a, b) => {
      const aExact = a.number === searchQuery
      const bExact = b.number === searchQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return parseInt(a.number || '0') - parseInt(b.number || '0')
    })

    setFilteredWarehouses(filtered.slice(0, 20))
  }, [warehouses])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value?.description) {
        filterWarehouses(query)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [query, filterWarehouses, value])

  const handleSelectWarehouse = (warehouse: Warehouse) => {
    setQuery(warehouse.description)
    onChange(warehouse)
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setShowDropdown(true)
    if (!newQuery) {
      onChange(null)
    }
  }

  const handleFocus = () => {
    if (cityRef && warehouses.length > 0) {
      setShowDropdown(true)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Відділення Нової Пошти
      </label>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        disabled={!cityRef || isLoading}
        placeholder={
          isLoading
            ? 'Завантаження відділень...'
            : !cityRef
            ? 'Спочатку оберіть місто'
            : 'Введіть номер або адресу відділення...'
        }
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${!cityRef || isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {showDropdown && cityRef && !isLoading && filteredWarehouses.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredWarehouses.map((warehouse) => (
            <button
              key={warehouse.ref}
              type="button"
              onClick={() => handleSelectWarehouse(warehouse)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">
                {warehouse.description}
              </div>
              {warehouse.shortAddress && (
                <div className="text-sm text-gray-500">{warehouse.shortAddress}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && cityRef && !isLoading && filteredWarehouses.length === 0 && query && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Відділення не знайдено
        </div>
      )}
    </div>
  )
}
