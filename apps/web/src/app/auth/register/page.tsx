'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'
import { useAuthStore } from '@/lib/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) return

    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Don't render form if authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
