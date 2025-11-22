'use client'

interface SortDropdownProps {
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void
}

export default function SortDropdown({
  sortBy,
  sortOrder,
  onSortChange,
}: SortDropdownProps) {
  const sortOptions = [
    { value: 'createdAt|DESC', label: 'Newest First' },
    { value: 'createdAt|ASC', label: 'Oldest First' },
    { value: 'price|ASC', label: 'Price: Low to High' },
    { value: 'price|DESC', label: 'Price: High to Low' },
    { value: 'name|ASC', label: 'Name: A to Z' },
    { value: 'name|DESC', label: 'Name: Z to A' },
    { value: 'stock|DESC', label: 'Stock: High to Low' },
    { value: 'stock|ASC', label: 'Stock: Low to High' },
  ]

  const currentValue = `${sortBy}|${sortOrder}`

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [newSortBy, newSortOrder] = e.target.value.split('|')
    onSortChange(newSortBy, newSortOrder as 'ASC' | 'DESC')
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentValue}
        onChange={handleSortChange}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
