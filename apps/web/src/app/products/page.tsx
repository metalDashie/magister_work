import { Suspense } from 'react'
import ProductList from '@/components/products/ProductList'
import { generateMetadata as generateMeta } from '@/lib/metadata'
import { Metadata } from 'next'

interface SearchParams {
  category?: string
  minPrice?: string
  maxPrice?: string
  inStock?: string
  page?: string
  sortBy?: string
  sortOrder?: string
  view?: string
  search?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const parts: string[] = []

  if (params.search) {
    parts.push(`Search: "${params.search}"`)
  }
  if (params.category) {
    parts.push(`Category ${params.category}`)
  }
  if (params.minPrice || params.maxPrice) {
    const priceRange = params.minPrice && params.maxPrice
      ? `${params.minPrice}-${params.maxPrice} UAH`
      : params.minPrice
        ? `from ${params.minPrice} UAH`
        : `up to ${params.maxPrice} UAH`
    parts.push(priceRange)
  }
  if (params.inStock === 'true') {
    parts.push('In Stock')
  }
  if (params.page && parseInt(params.page) > 1) {
    parts.push(`Page ${params.page}`)
  }

  const filterDescription = parts.length > 0 ? ` - ${parts.join(', ')}` : ''
  const title = `All Products${filterDescription}`

  // Build canonical URL without pagination for SEO
  const canonicalParams = new URLSearchParams()
  if (params.category) canonicalParams.set('category', params.category)
  if (params.minPrice) canonicalParams.set('minPrice', params.minPrice)
  if (params.maxPrice) canonicalParams.set('maxPrice', params.maxPrice)
  if (params.inStock) canonicalParams.set('inStock', params.inStock)
  if (params.sortBy && params.sortBy !== 'createdAt') canonicalParams.set('sortBy', params.sortBy)
  if (params.sortOrder && params.sortOrder !== 'DESC') canonicalParams.set('sortOrder', params.sortOrder)

  const canonicalQuery = canonicalParams.toString()
  const canonicalPath = canonicalQuery ? `/products?${canonicalQuery}` : '/products'

  return generateMeta({
    title,
    description: `Browse our complete collection of quality products${filterDescription}. Find the best deals on electronics, home goods, fashion, and more.`,
    path: canonicalPath,
    keywords: ['products', 'shop', 'catalog', 'buy online', 'товари', 'каталог'],
  })
}

// Loading skeleton for Suspense
function ProductListSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams

  // Parse filters for display
  const hasFilters = params.category || params.minPrice || params.maxPrice || params.inStock || params.search

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {params.search ? `Search results for "${params.search}"` : 'All Products'}
        </h1>
        <p className="mt-2 text-gray-600">
          {hasFilters
            ? 'Showing filtered results'
            : 'Browse our complete collection of products'}
        </p>
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList
          initialCategory={params.category ? parseInt(params.category) : undefined}
          initialMinPrice={params.minPrice ? parseFloat(params.minPrice) : undefined}
          initialMaxPrice={params.maxPrice ? parseFloat(params.maxPrice) : undefined}
          initialInStock={params.inStock === 'true' ? true : params.inStock === 'false' ? false : undefined}
          initialPage={params.page ? parseInt(params.page) : 1}
          initialSortBy={params.sortBy || 'createdAt'}
          initialSortOrder={(params.sortOrder as 'ASC' | 'DESC') || 'DESC'}
          initialViewMode={(params.view as 'grid' | 'list') || 'grid'}
          initialSearch={params.search}
        />
      </Suspense>
    </div>
  )
}
