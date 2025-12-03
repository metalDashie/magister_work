'use client'

import { useState } from 'react'
import ProductMappingModal from './ProductMappingModal'

interface MappedProduct {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

export interface ProductMapping {
  [rowIndex: number]: MappedProduct
}

interface ImportPreviewProps {
  preview: any[]
  mapping: Record<string, string>
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
  }
  productMappings?: ProductMapping
  onProductMappingChange?: (mappings: ProductMapping) => void
}

export default function ImportPreview({
  preview,
  mapping,
  stats,
  productMappings = {},
  onProductMappingChange,
}: ImportPreviewProps) {
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

  const extractValue = (row: any, field: string): string => {
    const csvColumn = mapping[field]
    if (!csvColumn) return '-'
    return row[csvColumn]?.toString() || '-'
  }

  const handleOpenMappingModal = (rowIndex: number) => {
    setSelectedRowIndex(rowIndex)
    setMappingModalOpen(true)
  }

  const handleProductSelect = (product: MappedProduct) => {
    if (selectedRowIndex !== null && onProductMappingChange) {
      const newMappings = {
        ...productMappings,
        [selectedRowIndex]: product,
      }
      onProductMappingChange(newMappings)
    }
    setMappingModalOpen(false)
    setSelectedRowIndex(null)
  }

  const handleRemoveMapping = (rowIndex: number) => {
    if (onProductMappingChange) {
      const newMappings = { ...productMappings }
      delete newMappings[rowIndex]
      onProductMappingChange(newMappings)
    }
  }

  const mappedCount = Object.keys(productMappings).length
  const newProductsCount = stats.totalRows - mappedCount

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.totalRows}</div>
          <div className="text-sm text-blue-700 mt-1">Total Rows</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.validRows}</div>
          <div className="text-sm text-green-700 mt-1">Valid Rows</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{mappedCount}</div>
          <div className="text-sm text-purple-700 mt-1">Mapped to Existing</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{newProductsCount}</div>
          <div className="text-sm text-orange-700 mt-1">New Products</div>
        </div>
      </div>

      {/* Preview Table */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Preview (First {preview.length} rows)</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Row
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {Object.entries(mapping).map(([field, csvColumn]) => (
                    <th
                      key={field}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {field}
                      <div className="text-xs font-normal text-gray-400 normal-case">
                        ({csvColumn})
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, index) => {
                  const mappedProduct = productMappings[index]
                  const isMapped = !!mappedProduct

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 ${isMapped ? 'bg-purple-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        {isMapped ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            Mapped
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            New
                          </span>
                        )}
                      </td>
                      {Object.keys(mapping).map((field) => (
                        <td key={field} className="px-4 py-3 text-sm text-gray-900">
                          <div className="max-w-xs truncate">{extractValue(row, field)}</div>
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {isMapped ? (
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-600 max-w-[150px] truncate" title={mappedProduct.name}>
                              → {mappedProduct.name}
                            </div>
                            <button
                              onClick={() => handleRemoveMapping(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove mapping"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenMappingModal(index)}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Map
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {stats.invalidRows > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-yellow-900">
                {stats.invalidRows} rows contain validation errors
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                These rows will be skipped during import. Check that required fields (Name, Price)
                are present and valid.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Notes */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Import Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Mapped products:</strong> Stock quantity from CSV will be added to existing product stock</li>
          <li>• <strong>New products:</strong> Will be created as new entries in the database</li>
          <li>• Products with existing SKUs will be updated (if SKU is provided and not mapped)</li>
          <li>• Invalid price formats will cause row to be skipped</li>
          <li>• Stock defaults to 0 if not provided or invalid</li>
        </ul>
      </div>

      {/* Mapping Modal */}
      <ProductMappingModal
        isOpen={mappingModalOpen}
        onClose={() => {
          setMappingModalOpen(false)
          setSelectedRowIndex(null)
        }}
        onSelect={handleProductSelect}
        parsedProductName={
          selectedRowIndex !== null
            ? extractValue(preview[selectedRowIndex], 'name')
            : ''
        }
      />
    </div>
  )
}
