import * as Papa from 'papaparse'
import { ColumnMapping } from '../database/entities/import-profile.entity'

export interface CSVParseResult {
  headers: string[]
  rows: any[]
  detectedDelimiter: string
  detectedEncoding: string
  rowCount: number
  preview: any[]
}

export interface DetectedProfile {
  profileId: string
  confidence: number
  suggestedMapping: ColumnMapping
}

export class CSVParser {
  // Common column name patterns for auto-detection
  private static readonly FIELD_PATTERNS = {
    name: [
      'name',
      'product_name',
      'productname',
      'title',
      'product',
      'item_name',
      'item',
      'название',
      'товар',
      'назва',
    ],
    sku: [
      'sku',
      'code',
      'product_code',
      'article',
      'артикул',
      'код',
      'model',
      'модель',
      'model_number',
      'modelnumber',
    ],
    description: [
      'description',
      'desc',
      'details',
      'описание',
      'опис',
      'product_description',
    ],
    price: [
      'price',
      'cost',
      'unit_price',
      'unitprice',
      'цена',
      'ціна',
      'стоимость',
      'вартість',
    ],
    stock: [
      'stock',
      'quantity',
      'qty',
      'available',
      'in_stock',
      'instock',
      'количество',
      'кількість',
      'наличие',
      'наявність',
    ],
    category: [
      'category',
      'cat',
      'type',
      'category_code',
      'categorycode',
      'категория',
      'категорія',
      'тип',
    ],
    images: ['image', 'img', 'photo', 'picture', 'url', 'image_url', 'фото', 'изображение'],
    currency: ['currency', 'cur', 'валюта'],
  }

  /**
   * Parse CSV file with auto-detection
   */
  static async parseCSV(
    fileContent: string,
    options?: {
      delimiter?: string
      encoding?: string
      preview?: number
    }
  ): Promise<CSVParseResult> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        delimiter: options?.delimiter || '',
        header: true,
        skipEmptyLines: true,
        encoding: options?.encoding || 'utf-8',
        complete: (results) => {
          const headers = results.meta.fields || []
          const rows = results.data as any[]
          const previewCount = options?.preview || 10

          resolve({
            headers,
            rows,
            detectedDelimiter: results.meta.delimiter,
            detectedEncoding: options?.encoding || 'utf-8',
            rowCount: rows.length,
            preview: rows.slice(0, previewCount),
          })
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`))
        },
      })
    })
  }

  /**
   * Auto-detect column mapping based on header names
   */
  static detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {}
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim())

    for (const [field, patterns] of Object.entries(this.FIELD_PATTERNS)) {
      for (let i = 0; i < lowerHeaders.length; i++) {
        const header = lowerHeaders[i]

        // Check if header matches any pattern
        const match = patterns.some((pattern) => {
          return (
            header === pattern ||
            header.includes(pattern) ||
            pattern.includes(header) ||
            this.calculateSimilarity(header, pattern) > 0.8
          )
        })

        if (match) {
          mapping[field as keyof ColumnMapping] = headers[i]
          break
        }
      }
    }

    return mapping
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance algorithm
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Validate mapping completeness
   */
  static validateMapping(mapping: ColumnMapping): {
    isValid: boolean
    missingFields: string[]
    warnings: string[]
  } {
    const requiredFields = ['name', 'price']
    const recommendedFields = ['sku', 'stock']

    const missingFields: string[] = []
    const warnings: string[] = []

    for (const field of requiredFields) {
      if (!mapping[field as keyof ColumnMapping]) {
        missingFields.push(field)
      }
    }

    for (const field of recommendedFields) {
      if (!mapping[field as keyof ColumnMapping]) {
        warnings.push(`Recommended field '${field}' is not mapped`)
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    }
  }

  /**
   * Detect delimiter from file content
   */
  static detectDelimiter(fileContent: string): string {
    const delimiters = [',', ';', '\t', '|']
    const sampleLines = fileContent.split('\n').slice(0, 5)

    let bestDelimiter = ','
    let maxConsistency = 0

    for (const delimiter of delimiters) {
      const counts = sampleLines.map((line) => line.split(delimiter).length)
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length
      const variance = counts.reduce((sum, count) => sum + Math.abs(count - avg), 0) / counts.length

      const consistency = avg / (variance + 1) // Higher is better

      if (consistency > maxConsistency && avg > 1) {
        maxConsistency = consistency
        bestDelimiter = delimiter
      }
    }

    return bestDelimiter
  }

  /**
   * Extract a specific column value based on mapping
   */
  static extractValue(
    row: any,
    mapping: string | string[] | undefined,
    defaultValue: any = null
  ): any {
    if (!mapping) return defaultValue

    if (typeof mapping === 'string') {
      return row[mapping] ?? defaultValue
    }

    // Multiple column mapping - concatenate values
    if (Array.isArray(mapping)) {
      const values = mapping.map((col) => row[col]).filter(Boolean)
      return values.length > 0 ? values.join(' ') : defaultValue
    }

    return defaultValue
  }
}
