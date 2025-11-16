'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

interface City {
  ref: string
  mainDescription: string
  area: string
  region: string
  fullDescription: string
}

interface CitySearchProps {
  value: City | null
  onChange: (city: City | null) => void
  error?: string
}

export function CitySearch({ value, onChange, error }: CitySearchProps) {
  const [query, setQuery] = useState(value?.mainDescription || '')
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const searchCities = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setCities([])
      return
    }

    setIsLoading(true)
    try {
      const response = await api.get('/delivery/cities/search', {
        params: { query: searchQuery, limit: 10 },
      })
      setCities(response.data)
    } catch (error) {
      console.error('Failed to search cities:', error)
      setCities([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value?.mainDescription) {
        searchCities(query)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchCities, value])

  const handleSelectCity = (city: City) => {
    setQuery(city.mainDescription)
    onChange(city)
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

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Місто доставки
      </label>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        placeholder="Почніть вводити назву міста..."
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {showDropdown && cities.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-2 text-sm text-gray-500">Завантаження...</div>
          )}
          {cities.map((city) => (
            <button
              key={city.ref}
              onClick={() => handleSelectCity(city)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium text-gray-900">
                {city.mainDescription}
              </div>
              <div className="text-sm text-gray-500">{city.area}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
