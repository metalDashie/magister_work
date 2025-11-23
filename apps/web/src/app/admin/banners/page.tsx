'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
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
  status: 'active' | 'inactive' | 'scheduled'
  startDate: string | null
  endDate: string | null
  priority: number
  showOnce: boolean
  dismissible: boolean
  pageTarget: string | null
  createdAt: string
}

interface BannerStats {
  total: number
  active: number
  inactive: number
  scheduled: number
}

const typeLabels: Record<string, string> = {
  modal: 'Модальне вікно',
  top_bar: 'Верхня панель',
  sidebar: 'Бічна панель',
}

const statusLabels: Record<string, string> = {
  active: 'Активний',
  inactive: 'Неактивний',
  scheduled: 'Заплановано',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
}

export default function BannersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  const [banners, setBanners] = useState<Banner[]>([])
  const [stats, setStats] = useState<BannerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    content: string
    imageUrl: string
    buttonText: string
    buttonUrl: string
    backgroundColor: string
    textColor: string
    type: 'modal' | 'top_bar' | 'sidebar'
    status: 'active' | 'inactive' | 'scheduled'
    startDate: string
    endDate: string
    priority: number
    showOnce: boolean
    dismissible: boolean
    pageTarget: string
  }>({
    title: '',
    description: '',
    content: '',
    imageUrl: '',
    buttonText: '',
    buttonUrl: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    type: 'modal',
    status: 'inactive',
    startDate: '',
    endDate: '',
    priority: 0,
    showOnce: false,
    dismissible: true,
    pageTarget: 'all',
  })

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchBanners()
      fetchStats()
    }
  }, [isAdmin])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await api.get('/banners/admin')
      setBanners(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/banners/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const openCreateModal = () => {
    setEditingBanner(null)
    setFormData({
      title: '',
      description: '',
      content: '',
      imageUrl: '',
      buttonText: '',
      buttonUrl: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      type: 'modal',
      status: 'inactive',
      startDate: '',
      endDate: '',
      priority: 0,
      showOnce: false,
      dismissible: true,
      pageTarget: 'all',
    })
    setShowModal(true)
  }

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description || '',
      content: banner.content || '',
      imageUrl: banner.imageUrl || '',
      buttonText: banner.buttonText || '',
      buttonUrl: banner.buttonUrl || '',
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      type: banner.type,
      status: banner.status,
      startDate: banner.startDate ? banner.startDate.slice(0, 16) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 16) : '',
      priority: banner.priority,
      showOnce: banner.showOnce,
      dismissible: banner.dismissible,
      pageTarget: banner.pageTarget || 'all',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      if (editingBanner) {
        await api.put(`/banners/admin/${editingBanner.id}`, payload)
      } else {
        await api.post('/banners/admin', payload)
      }
      setShowModal(false)
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Failed to save banner:', error)
      alert('Помилка збереження банера')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/banners/admin/${id}/status`, { status })
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей банер?')) return
    try {
      await api.delete(`/banners/admin/${id}`)
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete banner:', error)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Банери та акції</h1>
            <p className="text-gray-600 mt-1">Управління рекламними банерами та модальними вікнами</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Створити банер
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Всього</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Активних</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Неактивних</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Заплановано</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
            </div>
          </div>
        )}

        {/* Banners Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Назва</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пріоритет</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сторінка</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {banner.imageUrl && (
                        <img
                          src={banner.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{banner.title}</p>
                        {banner.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{banner.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {typeLabels[banner.type]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[banner.status]}`}>
                      {statusLabels[banner.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{banner.priority}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{banner.pageTarget || 'Всі'}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Редагувати
                      </button>
                      {banner.status !== 'active' ? (
                        <button
                          onClick={() => handleStatusChange(banner.id, 'active')}
                          className="text-green-600 hover:text-green-800"
                        >
                          Активувати
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(banner.id, 'inactive')}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          Деактивувати
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Банери не знайдено. Створіть перший банер!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingBanner ? 'Редагувати банер' : 'Створити банер'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Назва *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Контент (HTML)</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                      rows={4}
                      placeholder="<p>Ваш HTML контент тут...</p>"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL зображення</label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'modal' | 'top_bar' | 'sidebar' })}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="modal">Модальне вікно</option>
                        <option value="top_bar">Верхня панель</option>
                        <option value="sidebar">Бічна панель</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Текст кнопки</label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Детальніше"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL кнопки</label>
                      <input
                        type="text"
                        value={formData.buttonUrl}
                        onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="/products?sale=true"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Колір фону</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="w-10 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="flex-1 border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Колір тексту</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-10 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="flex-1 border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дата початку</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дата закінчення</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Пріоритет</label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'scheduled' })}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="inactive">Неактивний</option>
                        <option value="active">Активний</option>
                        <option value="scheduled">Заплановано</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сторінка</label>
                      <select
                        value={formData.pageTarget}
                        onChange={(e) => setFormData({ ...formData, pageTarget: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="all">Всі сторінки</option>
                        <option value="home">Головна</option>
                        <option value="products">Товари</option>
                        <option value="cart">Кошик</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.showOnce}
                        onChange={(e) => setFormData({ ...formData, showOnce: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Показувати один раз</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dismissible}
                        onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Можна закрити</span>
                    </label>
                  </div>

                  {/* Preview */}
                  {formData.title && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Попередній перегляд:</p>
                      <div
                        className="rounded-lg p-4"
                        style={{ backgroundColor: formData.backgroundColor, color: formData.textColor }}
                      >
                        <h3 className="text-lg font-bold">{formData.title}</h3>
                        {formData.description && <p className="mt-1">{formData.description}</p>}
                        {formData.buttonText && (
                          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">
                            {formData.buttonText}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingBanner ? 'Зберегти' : 'Створити'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
