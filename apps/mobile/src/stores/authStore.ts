import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../config/api'

interface User {
  id: string
  email: string
  name?: string
  phone?: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true })
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user } = response.data

      await AsyncStorage.setItem('token', access_token)
      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (email: string, password: string, name?: string) => {
    try {
      set({ isLoading: true })
      const response = await api.post('/auth/register', { email, password, name })
      const { access_token, user } = response.data

      await AsyncStorage.setItem('token', access_token)
      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (token) {
        const response = await api.get('/auth/me')
        set({
          user: response.data,
          token,
          isAuthenticated: true,
        })
      }
    } catch (error) {
      await AsyncStorage.removeItem('token')
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    }
  },
}))
