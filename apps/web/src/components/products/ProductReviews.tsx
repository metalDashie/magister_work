'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface Review {
  id: string
  userId: string
  rating: number
  title?: string
  content: string
  isVerifiedPurchase: boolean
  likesCount: number
  repliesCount: number
  createdAt: string
  isLikedByCurrentUser?: boolean
  user?: {
    id: string
    email: string
  }
}

interface ReviewsData {
  reviews: Review[]
  total: number
  page: number
  totalPages: number
  averageRating: number | null
  ratingDistribution: Record<number, number>
}

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated, user } = useAuthStore()
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [productId, page, sortBy])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reviews', {
        params: {
          productId,
          page: Number(page),
          limit: 5,
          sortBy
        },
      })
      setData(res.data)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || submitting) return

    // Validate content length (minimum 10 characters)
    if (newReview.content.length < 10) {
      setError('Review must be at least 10 characters long')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await api.post('/reviews', {
        productId,
        rating: newReview.rating,
        title: newReview.title || undefined,
        content: newReview.content,
      })
      setNewReview({ rating: 5, title: '', content: '' })
      setShowForm(false)
      fetchReviews()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit review'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleLike = async (reviewId: string) => {
    if (!isAuthenticated) return
    try {
      await api.post(`/reviews/${reviewId}/like`)
      fetchReviews()
    } catch (error) {
      console.error('Failed to like review:', error)
    }
  }

  const renderStars = (rating: number, size: string = 'w-5 h-5') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  const renderRatingInput = () => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setNewReview({ ...newReview, rating: star })}
          className="focus:outline-none"
        >
          <svg
            className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )

  if (loading && !data) {
    return (
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
      </div>
    )
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      {data && data.total > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">
                {Number(data.averageRating || 0).toFixed(1)}
              </div>
              <div className="mt-2">{renderStars(Math.round(Number(data.averageRating) || 0))}</div>
              <div className="text-sm text-gray-500 mt-1">{data.total} reviews</div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.ratingDistribution[star] || 0
                const percent = data.total > 0 ? (count / data.total) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-3">{star}</span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button / Form */}
      <div className="mb-8">
        {!isAuthenticated ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">
              <a href="/auth/login" className="text-primary-600 hover:underline font-medium">
                Log in
              </a>{' '}
              to write a review
            </p>
          </div>
        ) : !showForm ? (
          <button
            onClick={() => { setShowForm(true); setError(null); }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Write a Review
          </button>
        ) : (
            <form onSubmit={submitReview} className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                {renderRatingInput()}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Summary of your review"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
      </div>

      {/* Sort */}
      {data && data.total > 0 && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            Showing {data.reviews.length} of {data.total} reviews
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="mostLiked">Most Helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {data && data.reviews && data.reviews.length > 0 ? (
        <div className="space-y-6">
          {data.reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, 'w-4 h-4')}
                    {review.title && (
                      <span className="font-semibold text-gray-900">{review.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>{review.user?.email || 'Anonymous'}</span>
                    {review.isVerifiedPurchase && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Verified Purchase
                      </span>
                    )}
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-gray-700">{review.content}</p>
              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={() => toggleLike(review.id)}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-1 text-sm ${
                    review.isLikedByCurrentUser ? 'text-primary-600' : 'text-gray-500'
                  } hover:text-primary-600 disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill={review.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span>Helpful ({review.likesCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this product!
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded ${
                p === page ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
