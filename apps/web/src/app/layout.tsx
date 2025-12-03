import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/chat/ChatWidget'
import StructuredData from '@/components/seo/StructuredData'
import { BannerProvider } from '@/components/banners'
import { defaultMetadata } from '@/lib/metadata'
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/structured-data'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = defaultMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <head>
        <StructuredData data={[getOrganizationSchema(), getWebSiteSchema()]} />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <BannerProvider />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  )
}
