import { Metadata } from 'next'
import { generateMetadata as generateMeta } from '@/lib/metadata'

export const metadata: Metadata = generateMeta({
  title: 'Shopping Cart',
  description: 'View and manage items in your shopping cart.',
  path: '/cart',
  noIndex: true,
})

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
