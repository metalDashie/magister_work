'use client'

interface ImportPreviewProps {
  preview: any[]
  mapping: Record<string, string>
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
  }
}

export default function ImportPreview({ preview, mapping, stats }: ImportPreviewProps) {
  const extractValue = (row: any, field: string): string => {
    const csvColumn = mapping[field]
    if (!csvColumn) return '-'
    return row[csvColumn]?.toString() || '-'
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.totalRows}</div>
          <div className="text-sm text-blue-700 mt-1">Total Rows</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.validRows}</div>
          <div className="text-sm text-green-700 mt-1">Valid Rows</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.invalidRows}</div>
          <div className="text-sm text-red-700 mt-1">Invalid Rows</div>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    {Object.keys(mapping).map((field) => (
                      <td key={field} className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{extractValue(row, field)}</div>
                      </td>
                    ))}
                  </tr>
                ))}
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

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Import Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Products with existing SKUs will be updated (if SKU is provided)</li>
          <li>• Invalid price formats will cause row to be skipped</li>
          <li>• Stock defaults to 0 if not provided or invalid</li>
          <li>• Images should be comma-separated URLs</li>
        </ul>
      </div>
    </div>
  )
}
