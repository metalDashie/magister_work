import { Metadata } from 'next'
import { generateMetadata as generateMeta } from '@/lib/metadata'

export const metadata: Metadata = generateMeta({
  title: 'Checkout',
  description: 'Complete your purchase securely with fast delivery options.',
  path: '/checkout',
  noIndex: true,
})

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
