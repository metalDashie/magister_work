import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatPrice } from '@fullmag/common'
import ProductActions from '@/components/products/ProductActions'
import StructuredData from '@/components/seo/StructuredData'
import { generateMetadata as generateMeta } from '@/lib/metadata'
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data'
import OptimizedImage from '@/components/common/OptimizedImage'

const apiUrl = process.env.API_URL || 'http://localhost:3001'
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fullmag.com'

async function getProduct(id: string) {
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const product = await getProduct(params.id)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const price = formatPrice(product.price, product.currency || 'UAH')
  const image = product.images?.[0] || '/og-image.jpg'

  return generateMeta({
    title: product.name,
    description:
      product.description ||
      `Buy ${product.name} online at FullMag. ${price}. Fast delivery and secure payment.`,
    path: `/products/${product.id}`,
    image,
    type: 'product',
    keywords: [
      product.name,
      product.category?.name || '',
      product.sku || '',
      'buy online',
      'купити',
    ].filter(Boolean),
  })
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  // Breadcrumb for structured data
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Products', url: `${baseUrl}/products` },
  ]

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${baseUrl}/categories/${product.category.id}`,
    })
  }

  breadcrumbItems.push({
    name: product.name,
    url: `${baseUrl}/products/${product.id}`,
  })

  return (
    <>
      <StructuredData
        data={[getProductSchema(product), getBreadcrumbSchema(breadcrumbItems)]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-lg overflow-hidden">
            <OptimizedImage
              src={product.images?.[0]}
              alt={product.name}
              className="w-full h-96 rounded-lg"
              contentType="product"
              objectFit="cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {product.sku && (
            <p className="mt-2 text-sm text-gray-500">SKU: {product.sku}</p>
          )}

          <div className="mt-4">
            <span className="text-4xl font-bold text-primary-600">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-2 text-gray-600">
              {product.description || 'No description available'}
            </p>
          </div>

          <ProductActions
            productId={product.id}
            price={product.price}
            stock={product.stock}
          />

          {product.category && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Category:{' '}
                <span className="font-semibold">{product.category.name}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
