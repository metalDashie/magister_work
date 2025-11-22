'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Category {
  id: number
  name: string
  children?: Category[]
}

interface FilterSidebarProps {
  filters: {
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }
  onFilterChange: (filters: {
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }) => void
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || '',
  })
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    stock: true,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleCategoryChange = (categoryId: number | undefined) => {
    onFilterChange({ ...filters, categoryId })
  }

  const handlePriceChange = () => {
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined
    onFilterChange({ ...filters, minPrice, maxPrice })
  }

  const handleStockChange = (inStock: boolean | undefined) => {
    onFilterChange({ ...filters, inStock })
  }

  const handleClearFilters = () => {
    setPriceRange({ min: '', max: '' })
    onFilterChange({})
  }

  const toggleSection = (section: 'category' | 'price' | 'stock') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const hasActiveFilters =
    filters.categoryId || filters.minPrice || filters.maxPrice || filters.inStock !== undefined

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex justify-between items-center text-sm font-semibold text-gray-900 mb-3 hover:text-primary-600 transition-colors"
        >
          <span>Category</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              openSections.category ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
            openSections.category ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              checked={!filters.categoryId}
              onChange={() => handleCategoryChange(undefined)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <div key={category.id}>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  checked={filters.categoryId === category.id}
                  onChange={() => handleCategoryChange(category.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </label>
              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="ml-6 mt-2 space-y-2">
                  {category.children.map((child) => (
                    <label key={child.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.categoryId === child.id}
                        onChange={() => handleCategoryChange(child.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-600">{child.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex justify-between items-center text-sm font-semibold text-gray-900 mb-3 hover:text-primary-600 transition-colors"
        >
          <span>Price Range (UAH)</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              openSections.price ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${
            openSections.price ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Price</label>
            <input
              type="number"
              min="0"
              step="100"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Price</label>
            <input
              type="number"
              min="0"
              step="100"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <button
            onClick={handlePriceChange}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Apply Price Filter
          </button>
        </div>
      </div>

      {/* Stock Availability Filter */}
      <div>
        <button
          onClick={() => toggleSection('stock')}
          className="w-full flex justify-between items-center text-sm font-semibold text-gray-900 mb-3 hover:text-primary-600 transition-colors"
        >
          <span>Availability</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              openSections.stock ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
            openSections.stock ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <label className="flex items-center">
            <input
              type="radio"
              name="stock"
              checked={filters.inStock === undefined}
              onChange={() => handleStockChange(undefined)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">All Products</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="stock"
              checked={filters.inStock === true}
              onChange={() => handleStockChange(true)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">In Stock</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="stock"
              checked={filters.inStock === false}
              onChange={() => handleStockChange(false)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Out of Stock</span>
          </label>
        </div>
      </div>
    </div>
  )
}
