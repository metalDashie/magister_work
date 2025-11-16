import { create } from 'zustand'
import api from '../config/api'

interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    imageUrl?: string
  }
}

interface Cart {
  id: string
  items: CartItem[]
}

interface CartState {
  cart: Cart | null
  isLoading: boolean
  fetchCart: () => Promise<void>
  addItem: (productId: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalAmount: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true })
      const response = await api.get('/cart')
      set({ cart: response.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch cart:', error)
    }
  },

  addItem: async (productId: string, quantity: number) => {
    try {
      set({ isLoading: true })
      await api.post('/cart/items', { productId, quantity })
      await get().fetchCart()
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    try {
      set({ isLoading: true })
      await api.patch(`/cart/items/${itemId}`, { quantity })
      await get().fetchCart()
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  removeItem: async (itemId: string) => {
    try {
      set({ isLoading: true })
      await api.delete(`/cart/items/${itemId}`)
      await get().fetchCart()
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart')
      set({ cart: null })
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  },

  getTotalAmount: () => {
    const { cart } = get()
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  getItemCount: () => {
    const { cart } = get()
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
