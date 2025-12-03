'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface Coupon {
  id: string
  code: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usageLimitPerUser: number
  timesUsed: number
  startDate?: string
  endDate?: string
  status: 'active' | 'inactive' | 'expired'
  createdAt: string
}

interface CouponStats {
  total: number
  active: number
  inactive: number
  expired: number
  totalUsage: number
}

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'free_shipping', label: 'Free Shipping' },
]

export default function AdminCoupons() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState<CouponStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as const,
    value: 10,
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    usageLimitPerUser: 1,
    startDate: '',
    endDate: '',
  })

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons()
      fetchStats()
    }
  }, [isAdmin])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await api.get('/coupons')
      setCoupons(res.data)
    } catch (error) {
      console.error('Failed to fetch coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/coupons/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const openCreateModal = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      minOrderAmount: '',
      maxDiscountAmount: '',
      usageLimit: '',
      usageLimitPerUser: 1,
      startDate: '',
      endDate: '',
    })
    setShowModal(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      usageLimitPerUser: coupon.usageLimitPerUser,
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      }

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload)
      } else {
        await api.post('/coupons', payload)
      }

      setShowModal(false)
      fetchCoupons()
      fetchStats()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save coupon')
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      await api.patch(`/coupons/${id}/toggle`)
      fetchCoupons()
      fetchStats()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      fetchCoupons()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete coupon:', error)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Create Coupon
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Coupons</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-700">Active</div>
            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-700">Inactive</div>
            <div className="text-2xl font-bold text-gray-700">{stats.inactive}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-700">Expired</div>
            <div className="text-2xl font-bold text-red-700">{stats.expired}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-700">Total Usage</div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalUsage}</div>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No coupons found
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold">{coupon.code}</div>
                    {coupon.description && (
                      <div className="text-sm text-gray-500">{coupon.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 capitalize">{coupon.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} UAH`}
                  </td>
                  <td className="px-6 py-4">
                    {coupon.timesUsed} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      coupon.status === 'active' ? 'bg-green-100 text-green-800' :
                      coupon.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'No limit'}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEditModal(coupon)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button onClick={() => toggleStatus(coupon.id)} className="text-yellow-600 hover:text-yellow-800 mr-3">
                      {coupon.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deleteCoupon(coupon.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="SAVE20"
                    />
                    <button type="button" onClick={generateCode} className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="20% off your order"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {COUPON_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Value</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Order (optional)</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Discount (optional)</label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Per User</label>
                    <input
                      type="number"
                      value={formData.usageLimitPerUser}
                      onChange={(e) => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
