import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api'
import type { User, LoginDto, CreateUserDto } from '@fullmag/common'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (credentials: LoginDto) => Promise<void>
  register: (userData: CreateUserDto) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state, isLoading: !state })
      },

      login: async (credentials) => {
        const response = await api.post('/auth/login', credentials)
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        set({ user, token: access_token, isAuthenticated: true })
      },

      register: async (userData) => {
        const response = await api.post('/auth/register', userData)
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        set({ user, token: access_token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (user) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
