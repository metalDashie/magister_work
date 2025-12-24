export function formatPrice(amount: number, currency: string = 'UAH'): string {
  // Format number without currency symbol to avoid hydration mismatch
  // (server and client may have different locale data for currency symbols)
  const formatter = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const formattedAmount = formatter.format(amount)

  // Use consistent currency symbol
  const currencySymbols: Record<string, string> = {
    UAH: '₴',
    USD: '$',
    EUR: '€',
  }

  const symbol = currencySymbols[currency] || currency
  return `${formattedAmount} ${symbol}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('uk-UA').format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}
