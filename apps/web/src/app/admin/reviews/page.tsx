'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  title?: string
  content: string
  isVerifiedPurchase: boolean
  isVisible: boolean
  likesCount: number
  repliesCount: number
  createdAt: string
  complaintsCount?: number
  pendingComplaintsCount?: number
  user?: {
    id: string
    email: string
  }
  product?: {
    id: string
    name: string
  }
}

interface Complaint {
  id: string
  reviewId: string
  userId: string
  reason: string
  description?: string
  status: string
  adminNotes?: string
  resolvedAt?: string
  createdAt: string
  review?: Review
  user?: {
    id: string
    email: string
  }
}

interface ReviewStats {
  total: number
  visible: number
  hidden: number
  withComplaints: number
  pendingComplaints: number
}

const COMPLAINT_STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  under_review: 'blue',
  resolved: 'green',
  dismissed: 'gray',
}

const COMPLAINT_REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate_content: 'Inappropriate content',
  false_information: 'False information',
  harassment: 'Harassment',
  off_topic: 'Off-topic',
  advertising: 'Advertising',
  hate_speech: 'Hate speech',
  personal_information: 'Personal info',
  copyright_violation: 'Copyright',
  other: 'Other',
}

export default function AdminReviews() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'reviews' | 'complaints'>('reviews')
  const [reviews, setReviews] = useState<Review[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyWithComplaints, setShowOnlyWithComplaints] = useState(false)
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('ALL')
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [resolveModal, setResolveModal] = useState<Complaint | null>(null)
  const [resolveForm, setResolveForm] = useState({ status: 'resolved', adminNotes: '', hideReview: false })

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchStats()
      if (activeTab === 'reviews') {
        fetchReviews()
      } else {
        fetchComplaints()
      }
    }
  }, [isAdmin, activeTab])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (searchTerm) params.search = searchTerm
      if (showOnlyWithComplaints) params.hasComplaints = 'true'

      const response = await api.get('/reviews/admin/all', { params })
      setReviews(response.data)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (complaintStatusFilter !== 'ALL') {
        params.status = complaintStatusFilter
      }

      const response = await api.get('/reviews/complaints/all', { params })
      setComplaints(response.data)
    } catch (error) {
      console.error('Failed to fetch complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/reviews/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = () => {
    if (activeTab === 'reviews') {
      fetchReviews()
    } else {
      fetchComplaints()
    }
  }

  const toggleVisibility = async (reviewId: string) => {
    try {
      await api.patch(`/reviews/${reviewId}/visibility`)
      fetchReviews()
      fetchStats()
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
      alert('Failed to toggle review visibility')
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      fetchReviews()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete review:', error)
      alert('Failed to delete review')
    }
  }

  const resolveComplaint = async () => {
    if (!resolveModal) return
    try {
      await api.put(`/reviews/complaints/${resolveModal.id}/resolve`, resolveForm)
      setResolveModal(null)
      setResolveForm({ status: 'resolved', adminNotes: '', hideReview: false })
      fetchComplaints()
      fetchStats()
    } catch (error) {
      console.error('Failed to resolve complaint:', error)
      alert('Failed to resolve complaint')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
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
        <h1 className="text-3xl font-bold">Reviews Management</h1>
        <button
          onClick={() => {
            fetchStats()
            if (activeTab === 'reviews') fetchReviews()
            else fetchComplaints()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Reviews</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-700">Visible</div>
            <div className="text-2xl font-bold text-green-700">{stats.visible}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-700">Hidden</div>
            <div className="text-2xl font-bold text-gray-700">{stats.hidden}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg shadow">
            <div className="text-sm text-orange-700">With Complaints</div>
            <div className="text-2xl font-bold text-orange-700">{stats.withComplaints}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-700">Pending Complaints</div>
            <div className="text-2xl font-bold text-red-700">{stats.pendingComplaints}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'reviews'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-6 py-3 font-medium flex items-center ${
            activeTab === 'complaints'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Complaints
          {stats && stats.pendingComplaints > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {stats.pendingComplaints}
            </span>
          )}
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Content, user, product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyWithComplaints}
                    onChange={(e) => setShowOnlyWithComplaints(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Only show reviews with complaints
                  </span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Complaints
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr
                        key={review.id}
                        className={`hover:bg-gray-50 ${!review.isVisible ? 'bg-gray-100' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {review.user?.email}
                          </div>
                          {review.title && (
                            <div className="text-sm font-medium text-gray-900">
                              {review.title}
                            </div>
                          )}
                          <div
                            className="text-sm text-gray-600 max-w-md cursor-pointer"
                            onClick={() =>
                              setExpandedReview(
                                expandedReview === review.id ? null : review.id
                              )
                            }
                          >
                            {expandedReview === review.id
                              ? review.content
                              : review.content.length > 100
                              ? `${review.content.substring(0, 100)}...`
                              : review.content}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(review.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {review.product?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStars(review.rating)}
                          {review.isVerifiedPurchase && (
                            <span className="text-xs text-green-600 block mt-1">
                              Verified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              review.isVisible
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {review.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(review.complaintsCount ?? 0) > 0 ? (
                            <div className="flex items-center">
                              <span className="text-orange-600 font-semibold">
                                {review.complaintsCount}
                              </span>
                              {(review.pendingComplaintsCount ?? 0) > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                  {review.pendingComplaintsCount} pending
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleVisibility(review.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            {review.isVisible ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={complaintStatusFilter}
                  onChange={(e) => {
                    setComplaintStatusFilter(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No complaints found
              </div>
            ) : (
              complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                    complaint.status === 'pending'
                      ? 'border-yellow-500'
                      : complaint.status === 'resolved'
                      ? 'border-green-500'
                      : complaint.status === 'dismissed'
                      ? 'border-gray-500'
                      : 'border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold bg-${
                            COMPLAINT_STATUS_COLORS[complaint.status] || 'gray'
                          }-100 text-${
                            COMPLAINT_STATUS_COLORS[complaint.status] || 'gray'
                          }-800`}
                        >
                          {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          {COMPLAINT_REASON_LABELS[complaint.reason] || complaint.reason}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(complaint.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 mb-2">
                        Reported by: {complaint.user?.email}
                      </div>

                      {complaint.description && (
                        <div className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded">
                          {complaint.description}
                        </div>
                      )}

                      {/* Review Info */}
                      {complaint.review && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">
                            Review by: {complaint.review.user?.email}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(complaint.review.rating)}
                            {complaint.review.title && (
                              <span className="font-medium">
                                {complaint.review.title}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700">
                            {complaint.review.content}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Product: {complaint.review.product?.name || 'Unknown'}
                          </div>
                        </div>
                      )}

                      {complaint.adminNotes && (
                        <div className="mt-3 text-sm text-gray-600">
                          <strong>Admin Notes:</strong> {complaint.adminNotes}
                        </div>
                      )}
                    </div>

                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => {
                          setResolveModal(complaint)
                          setResolveForm({
                            status: 'resolved',
                            adminNotes: '',
                            hideReview: false,
                          })
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className="mt-6 text-sm text-gray-500 text-center">
        Showing {activeTab === 'reviews' ? reviews.length : complaints.length}{' '}
        {activeTab === 'reviews' ? 'reviews' : 'complaints'}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Resolve Complaint</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select
                value={resolveForm.status}
                onChange={(e) =>
                  setResolveForm({ ...resolveForm, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="resolved">Resolved (complaint is valid)</option>
                <option value="dismissed">Dismissed (complaint is invalid)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={resolveForm.adminNotes}
                onChange={(e) =>
                  setResolveForm({ ...resolveForm, adminNotes: e.target.value })
                }
                placeholder="Add notes about the resolution..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>

            {resolveForm.status === 'resolved' && (
              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolveForm.hideReview}
                    onChange={(e) =>
                      setResolveForm({ ...resolveForm, hideReview: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Hide the reviewed content
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResolveModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={resolveComplaint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
