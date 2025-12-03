import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { Client } from '@elastic/elasticsearch'
import { ConfigService } from '@nestjs/config'

const PRODUCTS_INDEX = 'products'

export interface ProductDocument {
  id: string
  name: string
  description: string
  sku: string
  price: number
  stock: number
  categoryId: string
  categoryName: string
  images: string[]
  createdAt: Date
  updatedAt: Date
}

export interface SearchResult {
  hits: ProductDocument[]
  total: number
  took: number
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name)
  private client: Client

  constructor(private configService: ConfigService) {
    const node = this.configService.get<string>('ELASTICSEARCH_NODE') || 'http://localhost:9200'
    this.client = new Client({ node })
  }

  async onModuleInit() {
    try {
      // Check connection
      const health = await this.client.cluster.health()
      this.logger.log(`Elasticsearch cluster health: ${health.status}`)

      // Create index if not exists
      await this.createIndexIfNotExists()
    } catch (error) {
      this.logger.warn(`Elasticsearch not available: ${error.message}. Search features will be limited.`)
    }
  }

  private async createIndexIfNotExists() {
    try {
      const indexExists = await this.client.indices.exists({ index: PRODUCTS_INDEX })

      if (!indexExists) {
        await this.client.indices.create({
          index: PRODUCTS_INDEX,
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                product_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding']
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                analyzer: 'product_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: {
                type: 'text',
                analyzer: 'product_analyzer'
              },
              sku: {
                type: 'keyword'
              },
              price: { type: 'float' },
              stock: { type: 'integer' },
              categoryId: { type: 'keyword' },
              categoryName: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              images: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        })
        this.logger.log(`Created index: ${PRODUCTS_INDEX}`)
      }
    } catch (error) {
      this.logger.error(`Failed to create index: ${error.message}`)
      throw error
    }
  }

  /**
   * Index a single product
   */
  async indexProduct(product: ProductDocument): Promise<void> {
    try {
      const { id, ...document } = product
      await this.client.index({
        index: PRODUCTS_INDEX,
        id,
        document
      })
      this.logger.debug(`Indexed product: ${product.id}`)
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}: ${error.message}`)
      throw error
    }
  }

  /**
   * Bulk index multiple products
   */
  async bulkIndexProducts(products: ProductDocument[]): Promise<{ indexed: number; errors: number }> {
    if (products.length === 0) {
      return { indexed: 0, errors: 0 }
    }

    try {
      const operations = products.flatMap(product => {
        const { id, ...doc } = product
        return [
          { index: { _index: PRODUCTS_INDEX, _id: id } },
          doc
        ]
      })

      const response = await this.client.bulk({
        refresh: true,
        operations
      })

      const errors = response.items.filter(item => item.index?.error).length
      const indexed = response.items.length - errors

      this.logger.log(`Bulk indexed ${indexed} products, ${errors} errors`)

      return { indexed, errors }
    } catch (error) {
      this.logger.error(`Bulk index failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Delete a product from index
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({
        index: PRODUCTS_INDEX,
        id: productId
      })
      this.logger.debug(`Deleted product from index: ${productId}`)
    } catch (error) {
      if (error.meta?.statusCode !== 404) {
        this.logger.error(`Failed to delete product ${productId}: ${error.message}`)
        throw error
      }
    }
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    options: {
      page?: number
      limit?: number
      minPrice?: number
      maxPrice?: number
      categoryId?: string
      inStock?: boolean
    } = {}
  ): Promise<SearchResult> {
    const { page = 1, limit = 20, minPrice, maxPrice, categoryId, inStock } = options
    const from = (page - 1) * limit

    try {
      // Build query
      const must: any[] = []
      const filter: any[] = []

      // Text search
      if (query && query.trim()) {
        must.push({
          multi_match: {
            query: query.trim(),
            fields: ['name^3', 'description', 'sku^2', 'categoryName'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        })
      } else {
        must.push({ match_all: {} })
      }

      // Price filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        const range: any = {}
        if (minPrice !== undefined) range.gte = minPrice
        if (maxPrice !== undefined) range.lte = maxPrice
        filter.push({ range: { price: range } })
      }

      // Category filter
      if (categoryId) {
        filter.push({ term: { categoryId } })
      }

      // Stock filter
      if (inStock !== undefined) {
        if (inStock) {
          filter.push({ range: { stock: { gt: 0 } } })
        } else {
          filter.push({ term: { stock: 0 } })
        }
      }

      const response = await this.client.search({
        index: PRODUCTS_INDEX,
        from,
        size: limit,
        query: {
          bool: {
            must,
            filter
          }
        },
        sort: query && query.trim()
          ? [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }]
          : [{ createdAt: { order: 'desc' } }],
        highlight: {
          fields: {
            name: {},
            description: {}
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        }
      })

      const hits = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
        _highlight: hit.highlight
      }))

      const total = typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0

      return {
        hits,
        total,
        took: response.took
      }
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(query: string, limit = 10): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      const response = await this.client.search({
        index: PRODUCTS_INDEX,
        size: limit,
        query: {
          bool: {
            should: [
              {
                prefix: {
                  'name.keyword': {
                    value: query.toLowerCase(),
                    boost: 2
                  }
                }
              },
              {
                match_phrase_prefix: {
                  name: {
                    query: query,
                    boost: 1
                  }
                }
              }
            ]
          }
        },
        _source: ['name']
      })

      const suggestions = response.hits.hits.map((hit: any) => hit._source.name)
      return [...new Set(suggestions)] // Remove duplicates
    } catch (error) {
      this.logger.error(`Suggestions failed: ${error.message}`)
      return []
    }
  }

  /**
   * Delete all documents from index
   */
  async clearIndex(): Promise<void> {
    try {
      await this.client.deleteByQuery({
        index: PRODUCTS_INDEX,
        query: { match_all: {} }
      })
      this.logger.log(`Cleared index: ${PRODUCTS_INDEX}`)
    } catch (error) {
      this.logger.error(`Failed to clear index: ${error.message}`)
      throw error
    }
  }

  /**
   * Get index stats
   */
  async getIndexStats(): Promise<{ documentCount: number; indexSize: string }> {
    try {
      const stats = await this.client.indices.stats({ index: PRODUCTS_INDEX })
      const indexStats = stats.indices?.[PRODUCTS_INDEX]

      return {
        documentCount: indexStats?.primaries?.docs?.count || 0,
        indexSize: this.formatBytes(indexStats?.primaries?.store?.size_in_bytes || 0)
      }
    } catch (error) {
      this.logger.error(`Failed to get index stats: ${error.message}`)
      return { documentCount: 0, indexSize: '0 B' }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Check if Elasticsearch is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.ping()
      return true
    } catch {
      return false
    }
  }
}
