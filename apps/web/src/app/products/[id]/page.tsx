import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatPrice } from '@fullmag/common'
import ProductImageGallery from '@/components/products/ProductImageGallery'
import ProductInfo from '@/components/products/ProductInfo'
import ProductSpecifications from '@/components/products/ProductSpecifications'
import ProductReviews from '@/components/products/ProductReviews'
import ProductTabs from '@/components/products/ProductTabs'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import StructuredData from '@/components/seo/StructuredData'
import { generateMetadata as generateMeta } from '@/lib/metadata'
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data'

const apiUrl = process.env.API_URL || 'http://localhost:10001'
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fullmag.com'

// Ensure API URL has /api suffix for server-side fetches
const getApiUrl = () => {
  const url = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
  return url
}

async function getProduct(id: string) {
  try {
    const res = await fetch(`${getApiUrl()}/products/${id}`, {
      next: { revalidate: 60 },
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

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

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

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  // Breadcrumb items
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
  ]

  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: `/products?category=${product.category.id}`,
    })
  }

  breadcrumbItems.push({ label: product.name })

  // Structured data breadcrumbs
  const structuredBreadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Products', url: `${baseUrl}/products` },
  ]

  if (product.category) {
    structuredBreadcrumbs.push({
      name: product.category.name,
      url: `${baseUrl}/products?category=${product.category.id}`,
    })
  }

  structuredBreadcrumbs.push({
    name: product.name,
    url: `${baseUrl}/products/${product.id}`,
  })

  // Tab content
  const tabs = [
    {
      id: 'description',
      label: 'Description',
      content: (
        <div className="prose prose-gray max-w-none">
          {product.description ? (
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          ) : (
            <p className="text-gray-500 italic">No description available for this product.</p>
          )}
        </div>
      ),
    },
    {
      id: 'specifications',
      label: 'Specifications',
      count: product.productAttributes?.length || 0,
      content: <ProductSpecifications attributes={product.productAttributes || []} />,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      count: product.reviewsCount || 0,
      content: <ProductReviews productId={product.id} />,
    },
  ]

  return (
    <>
      <StructuredData
        data={[getProductSchema(product), getBreadcrumbSchema(structuredBreadcrumbs)]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ProductImageGallery
              images={product.images || []}
              productName={product.name}
            />
          </div>

          {/* Right: Product Info */}
          <div>
            <ProductInfo product={product} />
          </div>
        </div>

        {/* Tabs Section */}
        <ProductTabs tabs={tabs} defaultTab="description" />

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Free Shipping</h3>
              <p className="text-sm text-gray-500">On orders over 1000 UAH</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Secure Payment</h3>
              <p className="text-sm text-gray-500">100% protected payments</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Easy Returns</h3>
              <p className="text-sm text-gray-500">14 days return policy</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">24/7 Support</h3>
              <p className="text-sm text-gray-500">Dedicated customer support</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
