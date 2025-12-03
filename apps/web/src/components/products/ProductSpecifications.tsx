'use client'

interface Attribute {
  id: string
  attribute: {
    id: string
    name: string
    type: string
    unit?: string
  }
  value: any
}

interface ProductSpecificationsProps {
  attributes: Attribute[]
}

export default function ProductSpecifications({ attributes }: ProductSpecificationsProps) {
  if (!attributes || attributes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No specifications available for this product.
      </div>
    )
  }

  const formatValue = (attr: Attribute): string => {
    const { value } = attr
    const { type, unit } = attr.attribute

    if (value === null || value === undefined) return '-'

    switch (type) {
      case 'boolean':
        return value ? 'Yes' : 'No'
      case 'number':
        return unit ? `${value} ${unit}` : String(value)
      case 'select':
      case 'text':
        return String(value)
      case 'multiselect':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'color':
        return (
          <span className="inline-flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: value }}
            />
            {value}
          </span>
        ) as unknown as string
      default:
        return String(value)
    }
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <tbody className="divide-y divide-gray-200">
          {attributes.map((attr, index) => (
            <tr
              key={attr.id}
              className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3">
                {attr.attribute.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {attr.attribute.type === 'color' ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: attr.value }}
                    />
                    {attr.value}
                  </span>
                ) : (
                  formatValue(attr)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
