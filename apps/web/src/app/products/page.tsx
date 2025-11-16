import ProductList from '@/components/products/ProductList'
import { generateMetadata as generateMeta } from '@/lib/metadata'
import { Metadata } from 'next'

export const metadata: Metadata = generateMeta({
  title: 'All Products',
  description: 'Browse our complete collection of quality products. Find the best deals on electronics, home goods, fashion, and more.',
  path: '/products',
  keywords: ['products', 'shop', 'catalog', 'buy online', 'товари', 'каталог'],
})

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
        <p className="mt-2 text-gray-600">
          Browse our complete collection of products
        </p>
      </div>

      <ProductList />
    </div>
  )
}
