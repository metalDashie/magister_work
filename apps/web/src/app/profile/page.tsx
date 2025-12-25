'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface UserProfile {
  id: string
  email: string
  phone: string | null
  role: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

type ModalType = 'profile' | 'email' | 'phone' | 'password' | null

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated, updateUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  })
  const [emailForm, setEmailForm] = useState({
    currentPassword: '',
    newEmail: '',
  })
  const [phoneForm, setPhoneForm] = useState({
    currentPassword: '',
    newPhone: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    fetchProfile()
  }, [_hasHydrated, isAuthenticated, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/me')
      setProfile(response.data)
      setProfileForm({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : '',
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: ModalType) => {
    setError('')
    setSuccess('')
    setActiveModal(type)
  }

  const closeModal = () => {
    setActiveModal(null)
    setError('')
    setSuccess('')
    // Reset forms
    setEmailForm({ currentPassword: '', newEmail: '' })
    setPhoneForm({ currentPassword: '', newPhone: '' })
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.patch('/users/me', {
        firstName: profileForm.firstName || null,
        lastName: profileForm.lastName || null,
        dateOfBirth: profileForm.dateOfBirth || null,
      })
      setProfile(response.data)
      updateUser(response.data)
      setSuccess('Профіль успішно оновлено')
      setTimeout(() => {
        closeModal()
      }, 1500)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Помилка оновлення профілю')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/users/me/change-email', emailForm)
      setSuccess('Лист для підтвердження відправлено на нову адресу')
      setTimeout(() => {
        closeModal()
      }, 2000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Помилка зміни email')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/users/me/change-phone', phoneForm)
      setSuccess('Код підтвердження відправлено на новий номер')
      setTimeout(() => {
        closeModal()
      }, 2000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Помилка зміни номера телефону')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Паролі не співпадають')
      setSubmitting(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Пароль повинен містити мінімум 8 символів')
      setSubmitting(false)
      return
    }

    try {
      await api.post('/users/me/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setSuccess('Пароль успішно змінено')
      setTimeout(() => {
        closeModal()
      }, 1500)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Помилка зміни пароля')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while hydrating
  if (!_hasHydrated || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center text-gray-500">Не вдалося завантажити профіль</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Мій акаунт</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Menu */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Меню</h2>
            <nav className="space-y-2">
              <Link
                href="/profile"
                className="block px-4 py-2 rounded-md bg-primary-50 text-primary-600 font-semibold"
              >
                Особисті дані
              </Link>
              <Link
                href="/profile/orders"
                className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Історія замовлень
              </Link>
              <Link
                href="/wishlist"
                className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Список бажань
              </Link>
              <Link
                href="/compare"
                className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Порівняння товарів
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Особисті дані</h2>
              <button
                onClick={() => openModal('profile')}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Редагувати
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ім'я</label>
                <p className="text-gray-900">{profile.firstName || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Прізвище</label>
                <p className="text-gray-900">{profile.lastName || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Дата народження</label>
                <p className="text-gray-900">
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString('uk-UA')
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Контактна інформація</h2>

            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                    {profile.emailVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Підтверджено
                      </span>
                    )}
                  </label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
                <button
                  onClick={() => openModal('email')}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Змінити
                </button>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Телефон
                    {profile.phone && profile.phoneVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Підтверджено
                      </span>
                    )}
                  </label>
                  <p className="text-gray-900">{profile.phone || '—'}</p>
                </div>
                <button
                  onClick={() => openModal('phone')}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  {profile.phone ? 'Змінити' : 'Додати'}
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Безпека</h2>

            <div className="flex items-center justify-between py-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Пароль</label>
                <p className="text-gray-900">••••••••</p>
              </div>
              <button
                onClick={() => openModal('password')}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Змінити пароль
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Інформація про акаунт</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Дата реєстрації</label>
                <p className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Останнє оновлення</label>
                <p className="text-gray-900">
                  {new Date(profile.updatedAt).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              {/* Profile Edit Modal */}
              {activeModal === 'profile' && (
                <form onSubmit={handleProfileSubmit}>
                  <h3 className="text-xl font-bold mb-4">Редагувати особисті дані</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Введіть ім'я"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Введіть прізвище"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дата народження</label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Збереження...' : 'Зберегти'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              )}

              {/* Email Change Modal */}
              {activeModal === 'email' && (
                <form onSubmit={handleEmailSubmit}>
                  <h3 className="text-xl font-bold mb-4">Змінити email</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>
                  )}

                  <p className="text-sm text-gray-600 mb-4">
                    Поточний email: <strong>{profile.email}</strong>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Поточний пароль</label>
                      <input
                        type="password"
                        value={emailForm.currentPassword}
                        onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Введіть поточний пароль"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Новий email</label>
                      <input
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Введіть новий email"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Відправка...' : 'Змінити email'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              )}

              {/* Phone Change Modal */}
              {activeModal === 'phone' && (
                <form onSubmit={handlePhoneSubmit}>
                  <h3 className="text-xl font-bold mb-4">
                    {profile.phone ? 'Змінити телефон' : 'Додати телефон'}
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>
                  )}

                  {profile.phone && (
                    <p className="text-sm text-gray-600 mb-4">
                      Поточний телефон: <strong>{profile.phone}</strong>
                    </p>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Поточний пароль</label>
                      <input
                        type="password"
                        value={phoneForm.currentPassword}
                        onChange={(e) => setPhoneForm({ ...phoneForm, currentPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Введіть поточний пароль"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Новий номер телефону</label>
                      <input
                        type="tel"
                        value={phoneForm.newPhone}
                        onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="+380XXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Відправка...' : profile.phone ? 'Змінити телефон' : 'Додати телефон'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              )}

              {/* Password Change Modal */}
              {activeModal === 'password' && (
                <form onSubmit={handlePasswordSubmit}>
                  <h3 className="text-xl font-bold mb-4">Змінити пароль</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Поточний пароль</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Введіть поточний пароль"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Новий пароль</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Мінімум 8 символів"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Підтвердження пароля</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Повторіть новий пароль"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Збереження...' : 'Змінити пароль'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
