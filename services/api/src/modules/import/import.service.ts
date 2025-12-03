import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  ImportProfile,
  ImportHistory,
  Product,
  Category,
  Attribute,
  ProductAttribute,
} from '../../database/entities'
import { CSVParser } from '../../utils/csv-parser'

export interface ImportPreview {
  headers: string[]
  preview: any[]
  suggestedMapping: any
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
  }
}

export interface ImportResult {
  historyId: string
  stats: {
    total: number
    successful: number
    failed: number
    skipped: number
    mapped: number // Products mapped to existing products (stock added)
  }
  errors: Array<{
    row: number
    field?: string
    message: string
  }>
}

export interface ProductMappingItem {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportProfile)
    private importProfileRepo: Repository<ImportProfile>,
    @InjectRepository(ImportHistory)
    private importHistoryRepo: Repository<ImportHistory>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Attribute)
    private attributeRepo: Repository<Attribute>,
    @InjectRepository(ProductAttribute)
    private productAttributeRepo: Repository<ProductAttribute>
  ) {}

  /**
   * Get all import profiles
   */
  async getProfiles(userId: string): Promise<ImportProfile[]> {
    return this.importProfileRepo.find({
      where: [{ isActive: true }, { createdById: userId }],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Get profile by ID
   */
  async getProfile(id: string): Promise<ImportProfile> {
    const profile = await this.importProfileRepo.findOne({ where: { id } })
    if (!profile) {
      throw new BadRequestException('Import profile not found')
    }
    return profile
  }

  /**
   * Create new import profile
   */
  async createProfile(data: Partial<ImportProfile>, userId: string): Promise<ImportProfile> {
    const profile = this.importProfileRepo.create({
      ...data,
      createdById: userId,
    })
    return this.importProfileRepo.save(profile)
  }

  /**
   * Update import profile
   */
  async updateProfile(id: string, data: Partial<ImportProfile>): Promise<ImportProfile> {
    await this.importProfileRepo.update(id, data)
    return this.getProfile(id)
  }

  /**
   * Delete import profile
   */
  async deleteProfile(id: string): Promise<void> {
    await this.importProfileRepo.delete(id)
  }

  /**
   * Parse and preview CSV file
   */
  async previewCSV(fileContent: string, profileId?: string): Promise<ImportPreview> {
    // Parse CSV
    const parsed = await CSVParser.parseCSV(fileContent, { preview: 20 })

    // Auto-detect or use profile mapping
    let mapping = CSVParser.detectColumnMapping(parsed.headers)

    if (profileId) {
      const profile = await this.getProfile(profileId)
      mapping = profile.columnMapping
    }

    // Validate preview rows
    const validRows: any[] = []
    const invalidRows: any[] = []

    for (const row of parsed.preview) {
      const validation = await this.validateRow(row, mapping)
      if (validation.isValid) {
        validRows.push(row)
      } else {
        invalidRows.push({ row, errors: validation.errors })
      }
    }

    return {
      headers: parsed.headers,
      preview: parsed.preview,
      suggestedMapping: mapping,
      stats: {
        totalRows: parsed.rowCount,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
      },
    }
  }

  /**
   * Import products from CSV
   */
  async importProducts(
    fileContent: string,
    fileName: string,
    profileId: string,
    userId: string,
    productMappings?: Record<number, ProductMappingItem>
  ): Promise<ImportResult> {
    const profile = await this.getProfile(profileId)

    // Create import history record
    const history = this.importHistoryRepo.create({
      fileName,
      profileId,
      importedById: userId,
      status: 'processing',
      stats: { total: 0, successful: 0, failed: 0, skipped: 0, mapped: 0, errors: [] },
    })
    await this.importHistoryRepo.save(history)

    try {
      // Parse CSV
      const parsed = await CSVParser.parseCSV(fileContent, {
        delimiter: profile.delimiter,
        encoding: profile.encoding,
      })

      const stats = {
        total: parsed.rows.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        mapped: 0,
      }
      const errors: Array<{ row: number; field?: string; message: string }> = []

      // Process each row
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i]

        try {
          // Check if this row is mapped to an existing product
          const mappedProduct = productMappings?.[i]

          if (mappedProduct) {
            // This row is mapped to an existing product - add stock quantity
            const existingProduct = await this.productRepo.findOne({
              where: { id: mappedProduct.id },
            })

            if (existingProduct) {
              // Extract stock from CSV row
              const productData = await this.transformRow(row, profile)
              const stockToAdd = productData.stock || 0

              // Add stock to existing product
              await this.productRepo.update(existingProduct.id, {
                stock: existingProduct.stock + stockToAdd,
              })

              stats.mapped++
              continue
            } else {
              // Mapped product no longer exists, treat as error
              stats.failed++
              errors.push({
                row: i + 2,
                message: `Mapped product with ID ${mappedProduct.id} not found`,
              })
              continue
            }
          }

          // Extract and transform data for new product
          const productData = await this.transformRow(row, profile)

          // Validate
          const validation = await this.validateProduct(productData, profile)
          if (!validation.isValid) {
            stats.failed++
            errors.push({
              row: i + 2, // +2 for header and 0-index
              message: validation.errors.join(', '),
            })
            continue
          }

          // Check for duplicates
          if (!profile.validationRules?.allowDuplicateSKU && productData.sku) {
            const existing = await this.productRepo.findOne({
              where: { sku: productData.sku },
            })

            if (existing) {
              // Update existing product
              await this.productRepo.update(existing.id, productData)
              stats.skipped++
              continue
            }
          }

          // Create new product
          const product = this.productRepo.create(productData)
          await this.productRepo.save(product)

          // Create product attributes if attributeMapping exists
          if (profile.attributeMapping && Object.keys(profile.attributeMapping).length > 0) {
            await this.createProductAttributes(product.id, row, profile.attributeMapping)
          }

          stats.successful++
        } catch (error) {
          stats.failed++
          errors.push({
            row: i + 2,
            message: error.message || 'Unknown error',
          })
        }
      }

      // Update history
      history.status = 'completed'
      history.stats = { ...stats, errors: errors.slice(0, 100) } // Limit errors
      history.completedAt = new Date()
      await this.importHistoryRepo.save(history)

      return {
        historyId: history.id,
        stats,
        errors,
      }
    } catch (error) {
      // Update history on failure
      history.status = 'failed'
      history.errorMessage = error.message
      history.completedAt = new Date()
      await this.importHistoryRepo.save(history)

      throw error
    }
  }

  /**
   * Transform CSV row to product data
   */
  private async transformRow(row: any, profile: ImportProfile): Promise<Partial<Product>> {
    const { columnMapping, transformations, validationRules } = profile

    // Extract basic fields
    const productData: any = {
      name: CSVParser.extractValue(row, columnMapping.name),
      sku: CSVParser.extractValue(row, columnMapping.sku),
      description: CSVParser.extractValue(row, columnMapping.description),
      currency: validationRules?.defaultCurrency || 'UAH',
    }

    // Transform price
    const priceRaw = CSVParser.extractValue(row, columnMapping.price)
    productData.price = this.transformPrice(priceRaw, transformations?.price)

    // Transform stock
    const stockRaw = CSVParser.extractValue(row, columnMapping.stock, '0')
    productData.stock = parseInt(stockRaw, 10) || 0

    // Transform category
    const categoryRaw = CSVParser.extractValue(row, columnMapping.category)
    if (categoryRaw && transformations?.categoryMapping) {
      productData.categoryId = transformations.categoryMapping[categoryRaw]
    }

    // Extract images
    const imagesRaw = CSVParser.extractValue(row, columnMapping.images)
    if (imagesRaw) {
      productData.images = Array.isArray(imagesRaw)
        ? imagesRaw
        : imagesRaw.split(',').map((img: string) => img.trim())
    }

    return productData
  }

  /**
   * Transform price based on transformation rules
   */
  private transformPrice(value: any, transformation?: any): number {
    if (!value) return 0

    let price = parseFloat(value.toString().replace(/[^\d.-]/g, ''))

    if (!transformation) return price

    switch (transformation.type) {
      case 'multiply':
        return price * (transformation.value || 1)
      case 'divide':
        return price / (transformation.value || 1)
      case 'currency_convert':
        // In real app, fetch exchange rate
        return price * 1.0 // Placeholder
      default:
        return price
    }
  }

  /**
   * Validate row data
   */
  private async validateRow(
    row: any,
    mapping: any
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    const name = CSVParser.extractValue(row, mapping.name)
    if (!name) {
      errors.push('Product name is required')
    }

    const price = CSVParser.extractValue(row, mapping.price)
    if (!price || parseFloat(price) <= 0) {
      errors.push('Valid price is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate product data
   */
  private async validateProduct(
    data: Partial<Product>,
    profile: ImportProfile
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []
    const rules = profile.validationRules

    // Required fields
    if (!data.name) errors.push('Product name is required')
    if (!data.price || data.price <= 0) errors.push('Valid price is required')

    // SKU requirement
    if (rules?.requireSKU && !data.sku) {
      errors.push('SKU is required')
    }

    // Price range
    if (rules?.minPrice && data.price && data.price < rules.minPrice) {
      errors.push(`Price must be at least ${rules.minPrice}`)
    }
    if (rules?.maxPrice && data.price && data.price > rules.maxPrice) {
      errors.push(`Price must not exceed ${rules.maxPrice}`)
    }

    // Stock validation
    if (rules?.minStock && data.stock !== undefined && data.stock < rules.minStock) {
      errors.push(`Stock must be at least ${rules.minStock}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(userId: string, limit = 50): Promise<ImportHistory[]> {
    return this.importHistoryRepo.find({
      where: { importedById: userId },
      relations: ['profile', 'importedBy'],
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  /**
   * Get import history by ID
   */
  async getImportHistoryById(id: string): Promise<ImportHistory> {
    const history = await this.importHistoryRepo.findOne({
      where: { id },
      relations: ['profile', 'importedBy'],
    })

    if (!history) {
      throw new BadRequestException('Import history not found')
    }

    return history
  }

  /**
   * Create product attributes from CSV row data
   */
  private async createProductAttributes(
    productId: string,
    row: any,
    attributeMapping: Record<string, string>
  ): Promise<void> {
    for (const [attrSlug, csvColumn] of Object.entries(attributeMapping)) {
      const rawValue = CSVParser.extractValue(row, csvColumn)
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue
      }

      // Find attribute by slug
      const attribute = await this.attributeRepo.findOne({
        where: { slug: attrSlug },
      })

      if (!attribute) {
        console.warn(`Attribute with slug "${attrSlug}" not found`)
        continue
      }

      // Parse value based on attribute type
      let parsedValue: any = rawValue

      switch (attribute.type) {
        case 'number':
        case 'range':
          parsedValue = parseFloat(rawValue.toString().replace(/[^\d.-]/g, ''))
          if (isNaN(parsedValue)) continue
          break
        case 'boolean':
          const lower = rawValue.toString().toLowerCase()
          parsedValue = lower === 'true' || lower === 'yes' || lower === '1'
          break
        case 'multi_select':
          // Handle comma-separated values
          if (typeof rawValue === 'string') {
            parsedValue = rawValue.split(',').map((v: string) => v.trim())
          }
          break
        case 'string':
        case 'select':
        default:
          parsedValue = rawValue.toString().trim()
          break
      }

      // Create product attribute
      const productAttribute = this.productAttributeRepo.create({
        productId,
        attributeId: attribute.id,
        value: parsedValue,
      })

      await this.productAttributeRepo.save(productAttribute)
    }
  }
}
