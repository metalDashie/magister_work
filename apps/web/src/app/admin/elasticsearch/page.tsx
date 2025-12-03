'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'

interface ProductHit {
  id: string
  name: string
  description: string
  sku: string
  price: number
  stock: number
  categoryName: string
  images: string[]
  _score?: number
  _highlight?: {
    name?: string[]
    description?: string[]
  }
}

interface SearchResult {
  hits: ProductHit[]
  total: number
  took: number
}

interface ElasticsearchStatus {
  available: boolean
  index?: string
  documentCount?: number
  indexSize?: string
  message?: string
}

export default function ElasticsearchTestPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  // Status
  const [status, setStatus] = useState<ElasticsearchStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  // Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Filters
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStock, setInStock] = useState<string>('')

  // Sync
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }

    loadStatus()
  }, [_hasHydrated, isAuthenticated, user, router])

  const loadStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await api.get('/elasticsearch/status')
      setStatus(response.data)
    } catch (error: any) {
      setStatus({
        available: false,
        message: error.response?.data?.message || 'Failed to connect to Elasticsearch'
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSearching(true)
    setShowSuggestions(false)

    try {
      const params: any = { q: searchQuery }
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (inStock) params.inStock = inStock

      const response = await api.get('/elasticsearch/search', { params })
      setSearchResults(response.data)
    } catch (error: any) {
      console.error('Search failed:', error)
      setSearchResults(null)
    } finally {
      setSearching(false)
    }
  }

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await api.get('/elasticsearch/suggestions', {
        params: { q: query, limit: 5 }
      })
      setSuggestions(response.data.suggestions || [])
    } catch (error) {
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, fetchSuggestions])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await api.post('/elasticsearch/sync')
      setSyncResult(response.data)
      loadStatus() // Refresh status after sync
    } catch (error: any) {
      setSyncResult({
        error: true,
        message: error.response?.data?.message || 'Sync failed'
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    // Trigger search with the suggestion
    setTimeout(() => handleSearch(), 0)
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'manager')) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Elasticsearch Test Page
        </h1>
        <p className="mt-2 text-gray-600">
          Test Elasticsearch search functionality and sync products from database
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Elasticsearch Status</h2>

        {statusLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={status.available ? 'text-green-700' : 'text-red-700'}>
                {status.available ? 'Connected' : 'Not Available'}
              </span>
            </div>

            {status.available && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{status.documentCount || 0}</div>
                  <div className="text-sm text-gray-600">Documents Indexed</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{status.indexSize || '0 B'}</div>
                  <div className="text-sm text-gray-600">Index Size</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{status.index || 'products'}</div>
                  <div className="text-sm text-gray-600">Index Name</div>
                </div>
              </div>
            )}

            {!status.available && status.message && (
              <div className="text-sm text-red-600">{status.message}</div>
            )}

            <div className="flex gap-4">
              <button
                onClick={loadStatus}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Status
              </button>
              <button
                onClick={handleSync}
                disabled={syncing || !status.available}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? 'Syncing...' : 'Sync Products to Elasticsearch'}
              </button>
            </div>

            {syncResult && (
              <div className={`p-4 rounded-lg ${syncResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {syncResult.error ? (
                  <span>{syncResult.message}</span>
                ) : (
                  <div>
                    <p className="font-medium">Sync completed successfully!</p>
                    <p className="text-sm mt-1">
                      Indexed: {syncResult.indexed} | Errors: {syncResult.errors} | Total Products: {syncResult.totalProducts}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Products</h2>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input with Suggestions */}
          <div className="relative">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={searching || !status?.available}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Price:</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Stock:</label>
              <select
                value={inStock}
                onChange={(e) => setInStock(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Search Results
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({searchResults.total} results in {searchResults.took}ms)
              </span>
            </h2>
          </div>

          {searchResults.hits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found matching your search
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.hits.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {product._highlight?.name ? (
                            <span dangerouslySetInnerHTML={{ __html: product._highlight.name[0] }} />
                          ) : (
                            product.name
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{product.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{product.price.toFixed(2)} UAH</div>
                        {product._score && (
                          <div className="text-xs text-gray-400">Score: {product._score.toFixed(2)}</div>
                        )}
                      </div>
                    </div>

                    {product.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {product._highlight?.description ? (
                          <span dangerouslySetInnerHTML={{ __html: product._highlight.description[0] }} />
                        ) : (
                          product.description
                        )}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      {product.sku && <span>SKU: {product.sku}</span>}
                      <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Start Elasticsearch using Docker: <code className="bg-blue-100 px-1 rounded">docker-compose up elasticsearch</code></li>
          <li>Click "Sync Products to Elasticsearch" to index all products from the database</li>
          <li>Use the search box to test full-text search functionality</li>
          <li>Try different queries to see relevance scoring and highlighting</li>
          <li>Use filters (price range, stock) to narrow down results</li>
        </ol>
      </div>
    </div>
  )
}
