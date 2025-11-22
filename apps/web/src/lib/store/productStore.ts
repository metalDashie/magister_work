import { create } from 'zustand'
import { api } from '../api'
import type { Product } from '@fullmag/common'

interface ProductFilters {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

interface ProductState {
  products: Product[]
  product: Product | null
  total: number
  page: number
  limit: number
  loading: boolean
  error: string | null
  filters: ProductFilters
  fetchProducts: (
    page?: number,
    limit?: number,
    filters?: ProductFilters
  ) => Promise<void>
  fetchProduct: (id: string) => Promise<void>
  searchProducts: (query: string) => Promise<void>
  setFilters: (filters: ProductFilters) => void
  clearFilters: () => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  product: null,
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  filters: {},

  fetchProducts: async (page = 1, limit = 20, filters = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/products', {
        params: {
          page,
          limit,
          ...filters,
        },
      })
      set({
        products: response.data.data,
        total: response.data.total,
        page,
        limit,
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get(`/products/${id}`)
      set({ product: response.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  searchProducts: async (query) => {
    set({ loading: true, error: null, filters: { search: query } })
    try {
      const response = await api.get('/products', {
        params: { search: query },
      })
      set({
        products: response.data.data,
        total: response.data.total,
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  setFilters: (filters) => {
    set({ filters })
  },

  clearFilters: () => {
    set({ filters: {} })
  },
}))
