import { create } from 'zustand'
import { api } from '../api'
import type { Product } from '@fullmag/common'

interface ProductState {
  products: Product[]
  product: Product | null
  total: number
  page: number
  limit: number
  loading: boolean
  error: string | null
  fetchProducts: (page?: number, limit?: number) => Promise<void>
  fetchProduct: (id: string) => Promise<void>
  searchProducts: (query: string) => Promise<void>
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  product: null,
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,

  fetchProducts: async (page = 1, limit = 20) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/products', {
        params: { page, limit },
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
    set({ loading: true, error: null })
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
}))
