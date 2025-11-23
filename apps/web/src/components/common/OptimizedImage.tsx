'use client'

import { useState, useEffect } from 'react'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
  contentType?: 'product' | 'category' | 'avatar' | 'general'
  fill?: boolean
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  contentType = 'general',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fill = false,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImgSrc(src || null)
    setHasError(false)
  }, [src])

  const handleError = () => {
    setHasError(true)
    setImgSrc(null)
  }

  const getPlaceholderIcon = () => {
    switch (contentType) {
      case 'product':
        return (
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        )
      case 'category':
        return (
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        )
      case 'avatar':
        return (
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )
    }
  }

  const getPlaceholderText = () => {
    switch (contentType) {
      case 'product':
        return 'No Product Image'
      case 'category':
        return 'No Category Image'
      case 'avatar':
        return 'No Avatar'
      default:
        return 'No Image Available'
    }
  }

  // If no image or error occurred, show placeholder
  if (!imgSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}
        style={{ width, height }}
      >
        {getPlaceholderIcon()}
        <p className="mt-2 text-xs text-gray-400 font-medium">
          {getPlaceholderText()}
        </p>
      </div>
    )
  }

  // Render the actual image
  const imageClasses = `${className} ${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : objectFit === 'fill' ? 'object-fill' : objectFit === 'none' ? 'object-none' : 'object-scale-down'}`

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={imageClasses}
      width={width}
      height={height}
      onError={handleError}
      loading="lazy"
    />
  )
}
