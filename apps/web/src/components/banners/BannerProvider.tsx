'use client'

import { usePathname } from 'next/navigation'
import { BannerModal } from './BannerModal'
import { TopBarBanner } from './TopBarBanner'

export function BannerProvider() {
  const pathname = usePathname()

  // Skip banners on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Determine page target based on pathname
  const getPageTarget = () => {
    if (pathname === '/') return 'home'
    if (pathname?.startsWith('/products')) return 'products'
    if (pathname?.startsWith('/cart')) return 'cart'
    return 'all'
  }

  const pageTarget = getPageTarget()

  return (
    <>
      <TopBarBanner pageTarget={pageTarget} />
      <BannerModal pageTarget={pageTarget} />
    </>
  )
}
