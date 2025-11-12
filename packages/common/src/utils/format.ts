export function formatPrice(amount: number, currency: string = 'UAH'): string {
  const formatter = new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency,
  })

  return formatter.format(amount)
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
