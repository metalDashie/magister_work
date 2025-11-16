import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = __DEV__
  ? 'http://10.0.2.2:3001/api' // Android emulator
  : 'https://api.fullmag.com/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('token')
      // You can emit an event here to trigger navigation
    }
    return Promise.reject(error)
  }
)

export default api
