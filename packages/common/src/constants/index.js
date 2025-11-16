"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.CURRENCY = exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
    },
    PRODUCTS: {
        LIST: '/products',
        BY_ID: (id) => `/products/${id}`,
        CREATE: '/products',
        UPDATE: (id) => `/products/${id}`,
        DELETE: (id) => `/products/${id}`,
    },
    CART: {
        GET: '/cart',
        ADD: '/cart/items',
        UPDATE: (id) => `/cart/items/${id}`,
        REMOVE: (id) => `/cart/items/${id}`,
        CLEAR: '/cart/clear',
    },
    ORDERS: {
        LIST: '/orders',
        BY_ID: (id) => `/orders/${id}`,
        CREATE: '/orders',
    },
    PAYMENTS: {
        CREATE_INVOICE: '/payments/invoice',
        WEBHOOK: '/payments/webhook',
    },
};
exports.CURRENCY = {
    UAH: 'UAH',
    USD: 'USD',
    EUR: 'EUR',
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=index.js.map