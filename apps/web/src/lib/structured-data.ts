// Structured Data (JSON-LD) generators for SEO

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fullmag.com'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  images?: string[]
  sku?: string
  category?: {
    id: string | number
    name: string
  }
  stock?: number
}

interface BreadcrumbItem {
  name: string
  url: string
}

// Organization Schema
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FullMag',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Multi-platform e-commerce system for quality products',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Ukrainian', 'English'],
    },
    sameAs: [
      // Add social media links here when available
    ],
  }
}

// WebSite Schema
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FullMag',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// Product Schema
export function getProductSchema(product: Product) {
  const imageUrl = product.images?.[0]
    ? product.images[0].startsWith('http')
      ? product.images[0]
      : `${baseUrl}${product.images[0]}`
    : `${baseUrl}/og-image.jpg`

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Buy ${product.name} at FullMag`,
    image: imageUrl,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'FullMag',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.id}`,
      priceCurrency: product.currency || 'UAH',
      price: product.price,
      availability:
        product.stock && product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'FullMag',
      },
    },
    ...(product.category && {
      category: product.category.name,
    }),
  }
}

// BreadcrumbList Schema
export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ItemList Schema (for product lists)
export function getItemListSchema(products: Product[], listName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/products/${product.id}`,
      name: product.name,
    })),
  }
}

// Helper to render JSON-LD script tag
export function renderJsonLd(data: object) {
  return {
    __html: JSON.stringify(data),
  }
}
