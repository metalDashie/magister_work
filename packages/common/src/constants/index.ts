export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  PRODUCTS: {
    LIST: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/items',
    UPDATE: (id: string) => `/cart/items/${id}`,
    REMOVE: (id: string) => `/cart/items/${id}`,
    CLEAR: '/cart/clear',
  },
  ORDERS: {
    LIST: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
  },
  PAYMENTS: {
    CREATE_INVOICE: '/payments/invoice',
    WEBHOOK: '/payments/webhook',
  },
} as const

export const CURRENCY = {
  UAH: 'UAH',
  USD: 'USD',
  EUR: 'EUR',
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const
