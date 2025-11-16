'use client'

import { useState } from 'react'

interface ColumnMapperProps {
  headers: string[]
  preview: any[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
}

const SYSTEM_FIELDS = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'sku', label: 'SKU / Product Code', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'price', label: 'Price', required: true },
  { key: 'stock', label: 'Stock Quantity', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'images', label: 'Image URLs', required: false },
  { key: 'currency', label: 'Currency', required: false },
]

export default function ColumnMapper({
  headers,
  preview,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const handleDrop = (systemField: string) => {
    if (!draggedColumn) return

    onMappingChange({
      ...mapping,
      [systemField]: draggedColumn,
    })
    setDraggedColumn(null)
  }

  const handleSelectChange = (systemField: string, csvColumn: string) => {
    if (csvColumn === '') {
      const newMapping = { ...mapping }
      delete newMapping[systemField]
      onMappingChange(newMapping)
    } else {
      onMappingChange({
        ...mapping,
        [systemField]: csvColumn,
      })
    }
  }

  const handleClearMapping = (systemField: string) => {
    const newMapping = { ...mapping }
    delete newMapping[systemField]
    onMappingChange(newMapping)
  }

  const getMappedCsvColumn = (systemField: string): string | undefined => {
    return mapping[systemField]
  }

  const getPreviewValue = (column: string): string => {
    if (preview.length > 0 && preview[0][column]) {
      return preview[0][column].toString().substring(0, 30)
    }
    return 'No preview'
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to map columns:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drag CSV columns from the left and drop onto system fields on the right</li>
          <li>• Or use the dropdown menus to select mappings</li>
          <li>• Required fields are marked with a red asterisk (*)</li>
          <li>• Auto-detected mappings are already filled in</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* CSV Columns (Source) */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV Columns
          </h3>
          <div className="space-y-2">
            {headers.map((header) => {
              const isMapped = Object.values(mapping).includes(header)

              return (
                <div
                  key={header}
                  draggable
                  onDragStart={() => setDraggedColumn(header)}
                  onDragEnd={() => setDraggedColumn(null)}
                  className={`p-3 rounded-lg border-2 cursor-move transition-all ${
                    draggedColumn === header
                      ? 'border-primary-500 bg-primary-50 shadow-lg'
                      : isMapped
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{header}</div>
                      <div className="text-xs text-gray-500 truncate">
                        Preview: "{getPreviewValue(header)}..."
                      </div>
                    </div>
                    {isMapped && (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Fields (Target) */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            System Fields
          </h3>
          <div className="space-y-2">
            {SYSTEM_FIELDS.map((field) => {
              const mappedColumn = getMappedCsvColumn(field.key)

              return (
                <div
                  key={field.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(field.key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mappedColumn
                      ? 'border-green-500 bg-green-50'
                      : field.required
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-gray-900">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    {mappedColumn && (
                      <button
                        onClick={() => handleClearMapping(field.key)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear mapping"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {mappedColumn ? (
                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-300">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{mappedColumn}</span>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => handleSelectChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Select CSV column...</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Mapping Status:</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Fields:</span>
            <span className="ml-2 font-semibold">{SYSTEM_FIELDS.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Mapped:</span>
            <span className="ml-2 font-semibold text-green-600">{Object.keys(mapping).length}</span>
          </div>
          <div>
            <span className="text-gray-600">Required Unmapped:</span>
            <span className="ml-2 font-semibold text-red-600">
              {SYSTEM_FIELDS.filter((f) => f.required && !mapping[f.key]).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
