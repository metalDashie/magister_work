'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Banner {
  id: string
  title: string
  description: string | null
  content: string | null
  imageUrl: string | null
  buttonText: string | null
  buttonUrl: string | null
  backgroundColor: string
  textColor: string
  type: 'modal' | 'top_bar' | 'sidebar'
  showOnce: boolean
  dismissible: boolean
}

interface BannerModalProps {
  pageTarget?: string
}

const DISMISSED_BANNERS_KEY = 'fullmag_dismissed_banners'

export function BannerModal({ pageTarget = 'all' }: BannerModalProps) {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [pageTarget])

  const fetchBanners = async () => {
    try {
      const response = await api.get('/banners/active', {
        params: { page: pageTarget, type: 'modal' },
      })
      const activeBanners = response.data as Banner[]

      // Filter out dismissed banners
      const dismissedBanners = getDismissedBanners()
      const visibleBanners = activeBanners.filter(
        (b) => !b.showOnce || !dismissedBanners.includes(b.id)
      )

      setBanners(visibleBanners)
      if (visibleBanners.length > 0) {
        setCurrentBanner(visibleBanners[0])
        setIsVisible(true)
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    }
  }

  const getDismissedBanners = (): string[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(DISMISSED_BANNERS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  const dismissBanner = (bannerId: string) => {
    const dismissed = getDismissedBanners()
    if (!dismissed.includes(bannerId)) {
      dismissed.push(bannerId)
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(dismissed))
    }
  }

  const handleClose = () => {
    if (currentBanner) {
      if (currentBanner.showOnce) {
        dismissBanner(currentBanner.id)
      }

      // Show next banner if available
      const currentIndex = banners.findIndex((b) => b.id === currentBanner.id)
      if (currentIndex < banners.length - 1) {
        setCurrentBanner(banners[currentIndex + 1])
      } else {
        setIsVisible(false)
        setCurrentBanner(null)
      }
    }
  }

  const handleButtonClick = () => {
    if (currentBanner?.buttonUrl) {
      if (currentBanner.showOnce) {
        dismissBanner(currentBanner.id)
      }
      setIsVisible(false)

      if (currentBanner.buttonUrl.startsWith('http')) {
        window.open(currentBanner.buttonUrl, '_blank')
      } else {
        router.push(currentBanner.buttonUrl)
      }
    }
  }

  if (!isVisible || !currentBanner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="relative max-w-lg w-full rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: currentBanner.backgroundColor }}
      >
        {/* Close button */}
        {currentBanner.dismissible && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 transition-colors"
            style={{ color: currentBanner.textColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Image */}
        {currentBanner.imageUrl && (
          <div className="w-full h-48 overflow-hidden">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6" style={{ color: currentBanner.textColor }}>
          <h2 className="text-2xl font-bold mb-2">{currentBanner.title}</h2>

          {currentBanner.description && (
            <p className="mb-4 opacity-90">{currentBanner.description}</p>
          )}

          {currentBanner.content && (
            <div
              className="mb-4 prose prose-sm max-w-none"
              style={{ color: currentBanner.textColor }}
              dangerouslySetInnerHTML={{ __html: currentBanner.content }}
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 mt-4">
            {currentBanner.dismissible && (
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg transition-colors opacity-70 hover:opacity-100"
                style={{ color: currentBanner.textColor }}
              >
                Закрити
              </button>
            )}
            {currentBanner.buttonText && currentBanner.buttonUrl && (
              <button
                onClick={handleButtonClick}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {currentBanner.buttonText}
              </button>
            )}
          </div>
        </div>

        {/* Banner count indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  banners[index].id === currentBanner.id
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
