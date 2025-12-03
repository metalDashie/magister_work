'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  reason: string
  description?: string
  quantity: number
  refundAmount?: number
  status: string
  adminNotes?: string
  createdAt: string
  processedAt?: string
  order?: {
    id: string
    totalAmount: number
  }
  user?: {
    email: string
  }
  orderItem?: {
    product?: {
      name: string
    }
    price: number
    quantity: number
  }
}

interface ReturnStats {
  total: number
  pending: number
  approved: number
  rejected: number
  refunded: number
  completed: number
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  approved: 'blue',
  rejected: 'red',
  received: 'purple',
  refunded: 'green',
  completed: 'gray',
}

const REASON_LABELS: Record<string, string> = {
  defective: 'Defective product',
  wrong_item: 'Wrong item received',
  not_as_described: 'Not as described',
  changed_mind: 'Changed mind',
  damaged_in_shipping: 'Damaged in shipping',
  other: 'Other',
}

export default function AdminReturns() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [stats, setStats] = useState<ReturnStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [processModal, setProcessModal] = useState<ReturnRequest | null>(null)
  const [processForm, setProcessForm] = useState({
    status: 'approved',
    adminNotes: '',
    refundAmount: '',
  })

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchReturns()
      fetchStats()
    }
  }, [isAdmin, statusFilter])

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }
      const res = await api.get('/returns', { params })
      setReturns(res.data)
    } catch (error) {
      console.error('Failed to fetch returns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/returns/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const openProcessModal = (returnReq: ReturnRequest) => {
    setProcessModal(returnReq)
    setProcessForm({
      status: 'approved',
      adminNotes: '',
      refundAmount: returnReq.orderItem ? String(returnReq.orderItem.price * returnReq.quantity) : '',
    })
  }

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!processModal) return

    try {
      await api.put(`/returns/${processModal.id}/process`, {
        status: processForm.status,
        adminNotes: processForm.adminNotes || undefined,
        refundAmount: processForm.refundAmount ? Number(processForm.refundAmount) : undefined,
      })
      setProcessModal(null)
      fetchReturns()
      fetchStats()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to process return')
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/returns/${id}/status`, { status })
      fetchReturns()
      fetchStats()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
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
        <h1 className="text-3xl font-bold">Returns Management</h1>
        <button onClick={() => { fetchReturns(); fetchStats(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-700">Pending</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-700">Approved</div>
            <div className="text-2xl font-bold text-blue-700">{stats.approved}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-700">Rejected</div>
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-700">Refunded</div>
            <div className="text-2xl font-bold text-green-700">{stats.refunded}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-700">Completed</div>
            <div className="text-2xl font-bold text-gray-700">{stats.completed}</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="ALL">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="received">Received</option>
          <option value="refunded">Refunded</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {returns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No return requests found
          </div>
        ) : (
          returns.map((ret) => (
            <div
              key={ret.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 border-${STATUS_COLORS[ret.status] || 'gray'}-500`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold bg-${STATUS_COLORS[ret.status] || 'gray'}-100 text-${STATUS_COLORS[ret.status] || 'gray'}-800`}>
                      {ret.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(ret.createdAt).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Order: {ret.orderId.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Customer: {ret.user?.email}
                  </div>

                  {ret.orderItem?.product && (
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <div className="font-medium">{ret.orderItem.product.name}</div>
                      <div className="text-sm text-gray-500">
                        Qty: {ret.quantity} × {ret.orderItem.price} UAH
                      </div>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-sm font-medium">Reason: </span>
                    <span className="text-sm">{REASON_LABELS[ret.reason] || ret.reason}</span>
                  </div>

                  {ret.description && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-2">
                      {ret.description}
                    </div>
                  )}

                  {ret.adminNotes && (
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Admin Notes:</strong> {ret.adminNotes}
                    </div>
                  )}

                  {ret.refundAmount && (
                    <div className="text-sm font-medium text-green-600 mt-2">
                      Refund Amount: {ret.refundAmount} UAH
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {ret.status === 'pending' && (
                    <button
                      onClick={() => openProcessModal(ret)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Process
                    </button>
                  )}
                  {ret.status === 'approved' && (
                    <>
                      <button
                        onClick={() => updateStatus(ret.id, 'received')}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Mark Received
                      </button>
                    </>
                  )}
                  {ret.status === 'received' && (
                    <button
                      onClick={() => updateStatus(ret.id, 'refunded')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Issue Refund
                    </button>
                  )}
                  {ret.status === 'refunded' && (
                    <button
                      onClick={() => updateStatus(ret.id, 'completed')}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Process Modal */}
      {processModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Process Return Request</h3>
            <form onSubmit={handleProcess}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Decision</label>
                <select
                  value={processForm.status}
                  onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              {processForm.status === 'approved' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Refund Amount (UAH)</label>
                  <input
                    type="number"
                    value={processForm.refundAmount}
                    onChange={(e) => setProcessForm({ ...processForm, refundAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                <textarea
                  value={processForm.adminNotes}
                  onChange={(e) => setProcessForm({ ...processForm, adminNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Notes about this decision..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setProcessModal(null)} className="px-4 py-2 text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
