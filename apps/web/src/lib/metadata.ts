import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fullmag.com'
const siteName = 'FullMag'
const defaultDescription = 'Multi-platform e-commerce system for quality products. Fast delivery, secure payments, and excellent customer service.'

interface MetadataParams {
  title: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  type?: 'website' | 'article' | 'product'
}

export function generateMetadata({
  title,
  description = defaultDescription,
  path = '',
  image = '/og-image.jpg',
  noIndex = false,
  keywords = [],
  type = 'website',
}: MetadataParams): Metadata {
  const url = `${baseUrl}${path}`
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`
  const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

  const defaultKeywords = [
    'онлайн магазин',
    'інтернет магазин',
    'купити онлайн',
    'електронна комерція',
    'online store',
    'e-commerce',
  ]

  return {
    title: fullTitle,
    description,
    keywords: [...defaultKeywords, ...keywords].join(', '),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
      languages: {
        'uk-UA': url,
        'en-US': url,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'uk_UA',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@fullmag',
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
  }
}

export const defaultMetadata = generateMetadata({
  title: siteName,
  description: defaultDescription,
})
