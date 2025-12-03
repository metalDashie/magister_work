'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import ColumnMapper from '@/components/admin/ColumnMapper'
import ImportPreview, { ProductMapping } from '@/components/admin/ImportPreview'
import ProfileSelector from '@/components/admin/ProfileSelector'

interface ImportProfile {
  id: string
  name: string
  description?: string
  columnMapping: Record<string, string>
  attributeMapping?: Record<string, string>
  transformations?: any
  validationRules?: any
}

interface CSVPreview {
  headers: string[]
  preview: any[]
  suggestedMapping: Record<string, string>
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
  }
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

export default function ProductImportPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  // Step management
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')

  // File data
  const [file, setFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null)

  // Profile management
  const [profiles, setProfiles] = useState<ImportProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ImportProfile | null>(
    null
  )
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [attributeMapping, setAttributeMapping] = useState<Record<string, string>>({})

  // Import state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Template save
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  // Product mappings (for mapping parsed products to existing DB products)
  const [productMappings, setProductMappings] = useState<ProductMapping>({})

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      console.log('[REDIRECT] admin/products/import/page.tsx -> /auth/login', {
        _hasHydrated,
        isAuthenticated,
      })
      // router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/')
      return
    }

    loadProfiles()
  }, [_hasHydrated, isAuthenticated, user, router])

  const loadProfiles = async () => {
    try {
      const response = await api.get('/import/profiles')
      setProfiles(response.data)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      if (selectedProfile) {
        formData.append('profileId', selectedProfile.id)
      }

      const response = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setCsvPreview(response.data)
      setColumnMapping(response.data.suggestedMapping || {})
      setCurrentStep('mapping')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse CSV file')
    }
  }

  const handleProfileSelect = (profile: ImportProfile | null) => {
    setSelectedProfile(profile)
    if (profile && csvPreview) {
      setColumnMapping(profile.columnMapping)
      setAttributeMapping(profile.attributeMapping || {})
    }
  }

  const handleMappingComplete = () => {
    setCurrentStep('preview')
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      await api.post('/import/profiles', {
        name: templateName,
        description: templateDescription,
        delimiter: ',',
        encoding: 'utf-8',
        hasHeader: true,
        columnMapping,
        attributeMapping,
        validationRules: {
          requireSKU: false,
          allowDuplicateSKU: true,
          defaultCurrency: 'UAH',
        },
      })

      alert('Template saved successfully!')
      setShowSaveTemplate(false)
      setTemplateName('')
      setTemplateDescription('')
      loadProfiles()
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    }
  }

  const handleImport = async () => {
    if (!file) return

    // Create or use existing profile
    let profileId = selectedProfile?.id

    if (!profileId) {
      // Create temporary profile
      try {
        const tempProfile = await api.post('/import/profiles', {
          name: `Temp Import ${new Date().toISOString()}`,
          delimiter: ',',
          encoding: 'utf-8',
          hasHeader: true,
          columnMapping,
          attributeMapping,
          validationRules: {
            defaultCurrency: 'UAH',
          },
        })
        profileId = tempProfile.data.id
      } catch (err) {
        setError('Failed to create import configuration')
        return
      }
    }

    setImporting(true)
    setCurrentStep('importing')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId || '')

      // Include product mappings if any exist
      if (Object.keys(productMappings).length > 0) {
        formData.append('productMappings', JSON.stringify(productMappings))
      }

      const response = await api.post('/import/execute', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImportResult(response.data)
      setCurrentStep('complete')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed')
      setCurrentStep('preview')
    } finally {
      setImporting(false)
    }
  }

  const handleStartOver = () => {
    setFile(null)
    setCsvPreview(null)
    setColumnMapping({})
    setAttributeMapping({})
    setProductMappings({})
    setImportResult(null)
    setError('')
    setCurrentStep('upload')
  }

  if (
    !isAuthenticated ||
    (user?.role !== 'admin' && user?.role !== 'manager')
  ) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Import Products from CSV
        </h1>
        <p className="mt-2 text-gray-600">
          Upload a CSV file and map columns to import products in bulk
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Upload File', 'Map Columns', 'Preview & Import', 'Complete'].map(
            (step, index) => {
              const stepStates: ImportStep[] = [
                'upload',
                'mapping',
                'preview',
                'complete',
              ]
              const currentIndex = stepStates.indexOf(currentStep)
              const isActive = index === currentIndex
              const isCompleted = index < currentIndex

              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex items-center relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        isActive
                          ? 'text-primary-600'
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            }
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Upload File */}
      {currentStep === 'upload' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4">
            Step 1: Upload CSV File
          </h2>

          {/* Profile Selector */}
          <div className="mb-6">
            <ProfileSelector
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelect={handleProfileSelect}
            />
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Drop your CSV file here, or click to browse
                </span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">CSV files up to 10MB</p>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-medium mb-2">CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>First row should contain column headers</li>
              <li>Required columns: Product Name, Price</li>
              <li>Recommended: SKU, Stock, Category</li>
              <li>Use comma (,) as delimiter</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {currentStep === 'mapping' && csvPreview && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Step 2: Map CSV Columns</h2>
            <button
              onClick={() => setShowSaveTemplate(!showSaveTemplate)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showSaveTemplate ? 'Cancel' : 'Save as Template'}
            </button>
          </div>

          {showSaveTemplate && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Save Mapping as Template</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={handleSaveAsTemplate}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Save Template
              </button>
            </div>
          )}

          <ColumnMapper
            headers={csvPreview.headers}
            preview={csvPreview.preview}
            mapping={columnMapping}
            onMappingChange={setColumnMapping}
            attributeMapping={attributeMapping}
            onAttributeMappingChange={setAttributeMapping}
          />

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep('upload')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleMappingComplete}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Continue to Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Import */}
      {currentStep === 'preview' && csvPreview && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-6">
            Step 3: Preview & Import
          </h2>

          <ImportPreview
            preview={csvPreview.preview}
            mapping={columnMapping}
            stats={csvPreview.stats}
            productMappings={productMappings}
            onProductMappingChange={setProductMappings}
          />

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep('mapping')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {currentStep === 'importing' && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <h2 className="mt-6 text-xl font-semibold">Importing Products...</h2>
          <p className="mt-2 text-gray-600">
            Please wait while we process your file
          </p>
        </div>
      )}

      {/* Step 5: Complete */}
      {currentStep === 'complete' && importResult && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <svg
              className="mx-auto h-16 w-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Import Complete!
            </h2>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {importResult.stats.total}
              </div>
              <div className="text-sm text-blue-700 mt-1">Total Rows</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {importResult.stats.successful}
              </div>
              <div className="text-sm text-green-700 mt-1">New Products</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {importResult.stats.mapped || 0}
              </div>
              <div className="text-sm text-purple-700 mt-1">Stock Added</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {importResult.stats.skipped}
              </div>
              <div className="text-sm text-yellow-700 mt-1">Skipped</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {importResult.stats.failed}
              </div>
              <div className="text-sm text-red-700 mt-1">Failed</div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-3">
                Errors ({importResult.errors.length})
              </h3>
              <div className="bg-red-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {importResult.errors
                  .slice(0, 10)
                  .map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-700 mb-2">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                {importResult.errors.length > 10 && (
                  <div className="text-sm text-red-600 mt-2">
                    ... and {importResult.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleStartOver}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              View Products
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
