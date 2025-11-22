'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore } from '@/lib/store/cartStore'
import { useEffect } from 'react'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { itemCount, fetchCart } = useCartStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-1">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              FullMag
            </Link>
            <nav className="ml-10 flex space-x-8">
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
                  <Link
                    href="/admin/dashboard"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/admin/products"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Products
                  </Link>
                  <Link
                    href="/admin/support"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Support
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
