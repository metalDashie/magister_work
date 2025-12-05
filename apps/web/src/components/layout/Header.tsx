'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { useTranslation } from '@/i18n'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { useEffect, useState, useRef } from 'react'

interface DropdownItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface AdminDropdownProps {
  label: string
  items: DropdownItem[]
  icon?: React.ReactNode
}

function AdminDropdown({ label, items, icon }: AdminDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-700 hover:text-primary-600 transition-colors"
      >
        {icon}
        <span>{label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { itemCount, fetchCart } = useCartStore()
  const { t } = useTranslation()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  // Admin navigation structure
  const storeItems: DropdownItem[] = [
    { label: t('nav.products'), href: '/admin/products' },
    { label: t('nav.categories'), href: '/admin/categories' },
    { label: t('admin.addProduct'), href: '/admin/attributes' },
    { label: t('admin.addProduct'), href: '/admin/products/import' },
    { label: t('admin.products'), href: '/admin/discounts' },
    { label: t('admin.products'), href: '/admin/coupons' },
    { label: t('admin.products'), href: '/admin/banners' },
  ]

  const salesItems: DropdownItem[] = [
    { label: t('nav.orders'), href: '/admin/orders' },
    { label: t('cart.title'), href: '/admin/abandoned-carts' },
    { label: t('admin.orders'), href: '/admin/returns' },
  ]

  const customersItems: DropdownItem[] = [
    { label: t('nav.users'), href: '/admin/users' },
    { label: t('reviews.title'), href: '/admin/reviews' },
    { label: t('chat.title'), href: '/admin/support' },
  ]

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-1">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              FullMag
            </Link>
            <nav className="ml-10 flex items-center space-x-6">
              <Link
                href="/products"
                className="text-gray-700 hover:text-primary-600"
              >
                Products
              </Link>
              <Link
                href="/categories"
                className="text-gray-700 hover:text-primary-600"
              >
                Categories
              </Link>
              {isAdmin && (
                <>
                  <div className="w-px h-6 bg-gray-300" />
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-1 text-gray-700 hover:text-primary-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Dashboard
                  </Link>
                  <AdminDropdown
                    label="Store"
                    items={storeItems}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    }
                  />
                  <AdminDropdown
                    label="Sales"
                    items={salesItems}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    }
                  />
                  <AdminDropdown
                    label="Customers"
                    items={customersItems}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    }
                  />
                  <Link
                    href="/admin/analytics"
                    className="flex items-center gap-1 text-gray-700 hover:text-primary-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/cart"
              className="relative text-gray-700 hover:text-primary-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-primary-600"
                >
                  {user?.email}
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-primary-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
