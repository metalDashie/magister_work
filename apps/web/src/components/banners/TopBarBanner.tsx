'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Banner {
  id: string
  title: string
  description: string | null
  buttonText: string | null
  buttonUrl: string | null
  backgroundColor: string
  textColor: string
  dismissible: boolean
  showOnce: boolean
}

interface TopBarBannerProps {
  pageTarget?: string
}

const DISMISSED_TOPBAR_KEY = 'fullmag_dismissed_topbar'

export function TopBarBanner({ pageTarget = 'all' }: TopBarBannerProps) {
  const router = useRouter()
  const [banner, setBanner] = useState<Banner | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    fetchBanner()
  }, [pageTarget])

  const fetchBanner = async () => {
    try {
      const response = await api.get('/banners/active', {
        params: { page: pageTarget, type: 'top_bar' },
      })
      const banners = response.data as Banner[]

      if (banners.length > 0) {
        const topBanner = banners[0]

        // Check if dismissed
        if (topBanner.showOnce) {
          const dismissed = getDismissedBanners()
          if (dismissed.includes(topBanner.id)) {
            return
          }
        }

        setBanner(topBanner)
        setIsVisible(true)
      }
    } catch (error) {
      console.error('Failed to fetch top bar banner:', error)
    }
  }

  const getDismissedBanners = (): string[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(DISMISSED_TOPBAR_KEY)
    return stored ? JSON.parse(stored) : []
  }

  const dismissBanner = () => {
    if (banner) {
      if (banner.showOnce) {
        const dismissed = getDismissedBanners()
        if (!dismissed.includes(banner.id)) {
          dismissed.push(banner.id)
          localStorage.setItem(DISMISSED_TOPBAR_KEY, JSON.stringify(dismissed))
        }
      }
      setIsVisible(false)
    }
  }

  const handleClick = () => {
    if (banner?.buttonUrl) {
      if (banner.buttonUrl.startsWith('http')) {
        window.open(banner.buttonUrl, '_blank')
      } else {
        router.push(banner.buttonUrl)
      }
    }
  }

  if (!isVisible || !banner) return null

  return (
    <div
      className="w-full py-2 px-4"
      style={{ backgroundColor: banner.backgroundColor, color: banner.textColor }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-4 text-sm">
          <span className="font-medium">{banner.title}</span>
          {banner.description && (
            <span className="hidden sm:inline opacity-90">— {banner.description}</span>
          )}
          {banner.buttonText && banner.buttonUrl && (
            <button
              onClick={handleClick}
              className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors font-medium"
            >
              {banner.buttonText}
            </button>
          )}
        </div>
        {banner.dismissible && (
          <button
            onClick={dismissBanner}
            className="ml-4 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
