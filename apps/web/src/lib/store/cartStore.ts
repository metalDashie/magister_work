import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api'
import type { Cart, AddToCartDto } from '@fullmag/common'
import { useAuthStore } from './authStore'

// Local cart item for guest users
interface LocalCartItem {
  productId: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    images?: string[]
    stock?: number
  }
}

interface CartState {
  cart: Cart | null
  localCart: LocalCartItem[]
  itemCount: number
  totalAmount: number
  isLoading: boolean
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  fetchCart: () => Promise<void>
  addItem: (item: AddToCartDto & { price: number; product?: LocalCartItem['product'] }) => Promise<void>
  removeItem: (itemId: string, productId?: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number, productId?: string) => Promise<void>
  clearCart: () => Promise<void>
  mergeCartsAfterLogin: () => Promise<void>
  getCartItems: () => (LocalCartItem | any)[]
}

const calculateTotals = (items: LocalCartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return { itemCount, totalAmount }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      localCart: [],
      itemCount: 0,
      totalAmount: 0,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      getCartItems: () => {
        const { isAuthenticated } = useAuthStore.getState()
        const { cart, localCart } = get()

        if (isAuthenticated && cart?.items) {
          return cart.items
        }
        return localCart
      },

      fetchCart: async () => {
        const { isAuthenticated } = useAuthStore.getState()

        if (!isAuthenticated) {
          // For guest users, just recalculate totals from local cart
          const { localCart } = get()
          const { itemCount, totalAmount } = calculateTotals(localCart)
          set({ itemCount, totalAmount })
          return
        }

        set({ isLoading: true })
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
        } finally {
          set({ isLoading: false })
        }
      },

      addItem: async (item) => {
        const { isAuthenticated } = useAuthStore.getState()

        if (!isAuthenticated) {
          // Add to local cart for guest users
          const { localCart } = get()
          const existingIndex = localCart.findIndex(
            (i) => i.productId === item.productId
          )

          let newLocalCart: LocalCartItem[]
          if (existingIndex >= 0) {
            newLocalCart = [...localCart]
            newLocalCart[existingIndex] = {
              ...newLocalCart[existingIndex],
              quantity: newLocalCart[existingIndex].quantity + item.quantity,
            }
          } else {
            newLocalCart = [
              ...localCart,
              {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                product: item.product,
              },
            ]
          }

          const { itemCount, totalAmount } = calculateTotals(newLocalCart)
          set({ localCart: newLocalCart, itemCount, totalAmount })
          return
        }

        // For authenticated users, use API
        set({ isLoading: true })
        try {
          await api.post('/cart/items', {
            productId: item.productId,
            quantity: item.quantity,
          })
          await get().fetchCart()
        } finally {
          set({ isLoading: false })
        }
      },

      removeItem: async (itemId, productId) => {
        const { isAuthenticated } = useAuthStore.getState()

        if (!isAuthenticated) {
          // Remove from local cart
          const { localCart } = get()
          const newLocalCart = localCart.filter(
            (item) => item.productId !== productId
          )
          const { itemCount, totalAmount } = calculateTotals(newLocalCart)
          set({ localCart: newLocalCart, itemCount, totalAmount })
          return
        }

        set({ isLoading: true })
        try {
          await api.delete(`/cart/items/${itemId}`)
          await get().fetchCart()
        } finally {
          set({ isLoading: false })
        }
      },

      updateQuantity: async (itemId, quantity, productId) => {
        const { isAuthenticated } = useAuthStore.getState()

        if (!isAuthenticated) {
          // Update local cart
          const { localCart } = get()
          let newLocalCart: LocalCartItem[]

          if (quantity <= 0) {
            newLocalCart = localCart.filter(
              (item) => item.productId !== productId
            )
          } else {
            newLocalCart = localCart.map((item) =>
              item.productId === productId
                ? { ...item, quantity }
                : item
            )
          }

          const { itemCount, totalAmount } = calculateTotals(newLocalCart)
          set({ localCart: newLocalCart, itemCount, totalAmount })
          return
        }

        set({ isLoading: true })
        try {
          await api.put(`/cart/items/${itemId}`, { quantity })
          await get().fetchCart()
        } finally {
          set({ isLoading: false })
        }
      },

      clearCart: async () => {
        const { isAuthenticated } = useAuthStore.getState()

        if (!isAuthenticated) {
          set({ localCart: [], itemCount: 0, totalAmount: 0 })
          return
        }

        set({ isLoading: true })
        try {
          await api.delete('/cart/clear')
          set({ cart: null, itemCount: 0, totalAmount: 0 })
        } finally {
          set({ isLoading: false })
        }
      },

      mergeCartsAfterLogin: async () => {
        const { localCart } = get()

        if (localCart.length === 0) {
          // No local cart to merge, just fetch server cart
          await get().fetchCart()
          return
        }

        set({ isLoading: true })
        try {
          // Add each local item to server cart
          for (const item of localCart) {
            await api.post('/cart/items', {
              productId: item.productId,
              quantity: item.quantity,
            })
          }

          // Clear local cart after merge
          set({ localCart: [] })

          // Fetch merged cart from server
          await get().fetchCart()
        } catch (error) {
          console.error('Failed to merge carts:', error)
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        localCart: state.localCart,
        itemCount: state.itemCount,
        totalAmount: state.totalAmount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
        // Recalculate totals from local cart after hydration
        if (state?.localCart) {
          const { itemCount, totalAmount } = calculateTotals(state.localCart)
          state.itemCount = itemCount
          state.totalAmount = totalAmount
        }
      },
    }
  )
)
