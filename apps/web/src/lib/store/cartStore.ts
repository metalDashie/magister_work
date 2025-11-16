import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api'
import type { Cart, AddToCartDto } from '@fullmag/common'

interface CartState {
  cart: Cart | null
  itemCount: number
  totalAmount: number
  fetchCart: () => Promise<void>
  addItem: (item: AddToCartDto) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      itemCount: 0,
      totalAmount: 0,

      fetchCart: async () => {
        try {
          const response = await api.get('/cart')
          const cart = response.data
          const itemCount = cart.items?.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          ) || 0
          const totalAmount = cart.items?.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          ) || 0
          set({ cart, itemCount, totalAmount })
        } catch (error) {
          console.error('Failed to fetch cart:', error)
        }
      },

      addItem: async (item) => {
        await api.post('/cart/items', item)
        await get().fetchCart()
      },

      removeItem: async (itemId) => {
        await api.delete(`/cart/items/${itemId}`)
        await get().fetchCart()
      },

      updateQuantity: async (itemId, quantity) => {
        await api.put(`/cart/items/${itemId}`, { quantity })
        await get().fetchCart()
      },

      clearCart: async () => {
        await api.delete('/cart/clear')
        set({ cart: null, itemCount: 0, totalAmount: 0 })
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
