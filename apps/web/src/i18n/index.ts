'use client'

import { useState, useCallback } from 'react'

const translations: Record<string, Record<string, string>> = {
  uk: {
    'nav.home': 'Головна',
    'nav.products': 'Товари',
    'nav.categories': 'Категорії',
    'nav.orders': 'Замовлення',
    'nav.users': 'Користувачі',
    'nav.cart': 'Кошик',
    'nav.login': 'Увійти',
    'nav.register': 'Реєстрація',
    'nav.logout': 'Вийти',
    'nav.profile': 'Профіль',
    'nav.search': 'Пошук',
    'admin.addProduct': 'Додати товар',
    'admin.products': 'Управління товарами',
    'admin.orders': 'Управління замовленнями',
    'cart.title': 'Кошик',
    'reviews.title': 'Відгуки',
    'chat.title': 'Чат підтримки',
  },
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.orders': 'Orders',
    'nav.users': 'Users',
    'nav.cart': 'Cart',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.profile': 'Profile',
    'nav.search': 'Search',
    'admin.addProduct': 'Add Product',
    'admin.products': 'Manage Products',
    'admin.orders': 'Manage Orders',
    'cart.title': 'Cart',
    'reviews.title': 'Reviews',
    'chat.title': 'Support Chat',
  },
}

let currentLocale = 'uk'

export function useTranslation() {
  const [, forceUpdate] = useState({})

  const t = useCallback((key: string): string => {
    return translations[currentLocale]?.[key] || translations['uk']?.[key] || key
  }, [])

  const changeLanguage = useCallback((locale: string) => {
    currentLocale = locale
    forceUpdate({})
  }, [])

  return { t, locale: currentLocale, changeLanguage }
}

export function getLocale() {
  return currentLocale
}

export function setLocale(locale: string) {
  currentLocale = locale
}
