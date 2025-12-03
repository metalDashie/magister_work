'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useProductStore } from '@/lib/store/productStore'
import ProductCard from './ProductCard'
import ProductListItem from './ProductListItem'
import Pagination from '@/components/common/Pagination'
import FilterSidebar from './FilterSidebar'
import SortDropdown from './SortDropdown'
import ViewToggle from './ViewToggle'

interface ProductListProps {
  initialCategory?: number
  initialMinPrice?: number
  initialMaxPrice?: number
  initialInStock?: boolean
  initialPage?: number
  initialSortBy?: string
  initialSortOrder?: 'ASC' | 'DESC'
  initialViewMode?: 'grid' | 'list'
}

export default function ProductList({
  initialCategory,
  initialMinPrice,
  initialMaxPrice,
  initialInStock,
  initialPage = 1,
  initialSortBy = 'createdAt',
  initialSortOrder = 'DESC',
  initialViewMode = 'grid',
}: ProductListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { products, loading, error, total, fetchProducts } = useProductStore()

  // Initialize state from props (which come from server-side searchParams)
  const [filters, setFilters] = useState({
    categoryId: initialCategory,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    inStock: initialInStock,
  })
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const itemsPerPage = 20

  // Update URL when state changes
  const updateURL = useCallback((
    newFilters: typeof filters,
    newPage: number,
    newSortBy: string,
    newSortOrder: 'ASC' | 'DESC',
    newViewMode: 'grid' | 'list'
  ) => {
    const params = new URLSearchParams()

    // Add filters
    if (newFilters.categoryId) params.set('category', newFilters.categoryId.toString())
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString())
    if (newFilters.inStock !== undefined) params.set('inStock', newFilters.inStock.toString())

    // Add pagination (only if not page 1)
    if (newPage > 1) params.set('page', newPage.toString())

    // Add sorting (only if not default)
    if (newSortBy !== 'createdAt') params.set('sortBy', newSortBy)
    if (newSortOrder !== 'DESC') params.set('sortOrder', newSortOrder)

    // Add view mode (only if not default)
    if (newViewMode !== 'grid') params.set('view', newViewMode)

    const queryString = params.toString()
    const newURL = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(newURL, { scroll: false })
  }, [pathname, router])

  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage, {
      ...filters,
      sortBy,
      sortOrder,
    })
  }, [currentPage, filters, sortBy, sortOrder, fetchProducts])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    updateURL(filters, newPage, sortBy, sortOrder, viewMode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newFilters: {
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }) => {
    const normalizedFilters = {
      categoryId: newFilters.categoryId,
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      inStock: newFilters.inStock,
    }
    setFilters(normalizedFilters)
    setCurrentPage(1) // Reset to first page when filters change
    updateURL(normalizedFilters, 1, sortBy, sortOrder, viewMode)
  }

  const handleSortChange = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1) // Reset to first page when sorting changes
    updateURL(filters, 1, newSortBy, newSortOrder, viewMode)
  }

  const handleViewChange = (newViewMode: 'grid' | 'list') => {
    setViewMode(newViewMode)
    updateURL(filters, currentPage, sortBy, sortOrder, newViewMode)
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
            <ViewToggle view={viewMode} onViewChange={handleViewChange} />
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
