'use client'

import { useEffect, useState } from 'react'
import { useProductStore } from '@/lib/store/productStore'
import ProductCard from './ProductCard'
import ProductListItem from './ProductListItem'
import Pagination from '@/components/common/Pagination'
import FilterSidebar from './FilterSidebar'
import SortDropdown from './SortDropdown'
import ViewToggle from './ViewToggle'

export default function ProductList() {
  const { products, loading, error, total, fetchProducts } = useProductStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<{
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }>({})
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const itemsPerPage = 20

  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage, {
      ...filters,
      sortBy,
      sortOrder,
    })
  }, [currentPage, filters, sortBy, sortOrder, fetchProducts])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newFilters: {
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSortChange = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filter Sidebar */}
      <aside className="lg:col-span-1">
        <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
        </div>
      </aside>

      {/* Products Grid */}
      <div className="lg:col-span-3">
        {/* Sort, View Toggle, and Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="text-sm text-gray-600">
            {total > 0 && (
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, total)} of {total} products
              </span>
            )}
            {total === 0 && <span>No products found</span>}
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            <SortDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No products match your filters</p>
            <button
              onClick={() => handleFilterChange({})}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalItems={total}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                showPageNumbers={true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
