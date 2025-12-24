'use client'

import { useTranslation } from '@/i18n'

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useTranslation()

  return (
    <select
      value={locale}
      onChange={(e) => changeLanguage(e.target.value)}
      className="text-sm border rounded px-2 py-1"
    >
      <option value="uk">UA</option>
      <option value="en">EN</option>
    </select>
  )
}
