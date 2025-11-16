export declare const API_ROUTES: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
    };
    readonly PRODUCTS: {
        readonly LIST: "/products";
        readonly BY_ID: (id: string) => string;
        readonly CREATE: "/products";
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
    };
    readonly CART: {
        readonly GET: "/cart";
        readonly ADD: "/cart/items";
        readonly UPDATE: (id: string) => string;
        readonly REMOVE: (id: string) => string;
        readonly CLEAR: "/cart/clear";
    };
    readonly ORDERS: {
        readonly LIST: "/orders";
        readonly BY_ID: (id: string) => string;
        readonly CREATE: "/orders";
    };
    readonly PAYMENTS: {
        readonly CREATE_INVOICE: "/payments/invoice";
        readonly WEBHOOK: "/payments/webhook";
    };
};
export declare const CURRENCY: {
    readonly UAH: "UAH";
    readonly USD: "USD";
    readonly EUR: "EUR";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
