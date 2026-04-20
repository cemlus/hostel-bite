/**
 * API Endpoint constants for HostelBite
 */

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    RANKED: '/products/ranked',
    CREATE: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    VOTE: (id: string) => `/products/${id}/vote`,
  },
  
  // Orders
  ORDERS: {
    CREATE: '/orders',
    MINE: '/orders/mine',
    DETAIL: (id: string) => `/orders/${id}`,
    SHOP_LIST: '/orders/shop/list',
    SHOP_ANALYTICS: '/orders/shop/analytics',
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
  },
  
  // Shops
  SHOPS: {
    LIST: '/shops',
    CREATE: '/shops',
    MINE: '/shops/mine',
    DETAIL: (id: string) => `/shops/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    MINE: '/notifications/mine',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
  
  // Hostels
  HOSTELS: {
    LIST: '/hostels',
  },
} as const;
