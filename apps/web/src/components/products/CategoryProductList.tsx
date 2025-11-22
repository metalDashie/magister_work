'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ProductCard from './ProductCard'
import Pagination from '@/components/common/Pagination'

interface CategoryProductListProps {
  categoryId: string
}

export default function CategoryProductList({ categoryId }: CategoryProductListProps) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    fetchProducts()
  }, [categoryId, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products', {
        params: {
          categoryId,
          page: currentPage,
          limit: itemsPerPage,
        },
      })

      if (response.data.data) {
        setProducts(response.data.data)
        setTotal(response.data.total || 0)
      } else {
        setProducts(response.data)
        setTotal(response.data.length)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No products in this category yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

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
  )
}
