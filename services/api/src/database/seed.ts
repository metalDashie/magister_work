import { DataSource } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'papaparse'
import { UserRole } from '@fullmag/common'
import {
  User,
  Category,
  Product,
  Attribute,
  ProductAttribute,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Notification,
  ChatRoom,
  ChatMessage,
  DeliveryAddress,
  ImportProfile,
  ImportHistory,
  TelegramUser,
  WhatsAppUser,
  Review,
  ReviewLike,
  ReviewReply,
  ReviewComplaint,
} from './entities'
import defaultUsersData from './seed-data/default-users.json'
import { attributesSeedData } from './seed-data/attributes.seed'

// All entity classes for DataSource configuration
const allEntities = [
  User,
  Category,
  Product,
  Attribute,
  ProductAttribute,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Notification,
  ChatRoom,
  ChatMessage,
  DeliveryAddress,
  ImportProfile,
  ImportHistory,
  TelegramUser,
  WhatsAppUser,
  Review,
  ReviewLike,
  ReviewReply,
  ReviewComplaint,
]

const defaultUsers = defaultUsersData as any

// Category mapping from CSV category names to Ukrainian category names
const categoryMapping: Record<string, { name: string; parent?: string }> = {
  'Smartphones': { name: 'Смартфони', parent: 'Електроніка' },
  'Laptops': { name: 'Ноутбуки', parent: 'Електроніка' },
  'Tablets': { name: 'Планшети', parent: 'Електроніка' },
  'Accessories': { name: 'Аксесуари', parent: 'Електроніка' },
  'Wearables': { name: 'Розумні годинники', parent: 'Електроніка' },
  'Monitors': { name: 'Монітори', parent: 'Електроніка' },
  'Smart Home': { name: 'Розумний дім', parent: 'Електроніка' },
  'Home Appliances': { name: 'Побутова техніка', parent: 'Дім та сад' },
  'Books': { name: 'Книги' },
  'Sports & Fitness': { name: 'Спорт та фітнес' },
  'Fashion & Clothing': { name: 'Одяг' },
  'Beauty & Personal Care': { name: 'Краса та догляд' },
  'Toys & Kids': { name: 'Дитячі товари' },
  'Furniture': { name: 'Меблі', parent: 'Дім та сад' },
  'Outdoor & Garden': { name: 'Сад та город', parent: 'Дім та сад' },
}

interface CsvProduct {
  'Product Name': string
  'SKU': string
  'Description': string
  'Price': string
  'Currency': string
  'Stock': string
  'Category': string
  'Image URL': string
  'Attributes': string
}

async function seed() {
  // Initialize DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '10080'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'fullmag',
    entities: allEntities,
    synchronize: false,
  })

  try {
    await dataSource.initialize()
    console.log('Database connection established')

    // Repositories
    const userRepo = dataSource.getRepository(User)
    const categoryRepo = dataSource.getRepository(Category)
    const productRepo = dataSource.getRepository(Product)
    const attributeRepo = dataSource.getRepository(Attribute)
    const productAttributeRepo = dataSource.getRepository(ProductAttribute)

    // Clear existing data
    console.log('Clearing existing data...')
    await dataSource.query('TRUNCATE TABLE "review_complaints" CASCADE')
    await dataSource.query('TRUNCATE TABLE "review_likes" CASCADE')
    await dataSource.query('TRUNCATE TABLE "review_replies" CASCADE')
    await dataSource.query('TRUNCATE TABLE "reviews" CASCADE')
    await dataSource.query('TRUNCATE TABLE "order_items" CASCADE')
    await dataSource.query('TRUNCATE TABLE "orders" CASCADE')
    await dataSource.query('TRUNCATE TABLE "cart_items" CASCADE')
    await dataSource.query('TRUNCATE TABLE "carts" CASCADE')
    await dataSource.query('TRUNCATE TABLE "payments" CASCADE')
    await dataSource.query('TRUNCATE TABLE "notifications" CASCADE')
    await dataSource.query('TRUNCATE TABLE "chat_messages" CASCADE')
    await dataSource.query('TRUNCATE TABLE "chat_rooms" CASCADE')
    await dataSource.query('TRUNCATE TABLE "delivery_addresses" CASCADE')
    await dataSource.query('TRUNCATE TABLE "import_history" CASCADE')
    await dataSource.query('TRUNCATE TABLE "import_profiles" CASCADE')
    await dataSource.query('TRUNCATE TABLE "product_attributes" CASCADE')
    await dataSource.query('TRUNCATE TABLE "products" CASCADE')
    await dataSource.query('TRUNCATE TABLE "attributes" CASCADE')
    await dataSource.query('TRUNCATE TABLE "categories" CASCADE')
    await dataSource.query('TRUNCATE TABLE "telegram_users" CASCADE')
    await dataSource.query('TRUNCATE TABLE "whatsapp_users" CASCADE')
    await dataSource.query('TRUNCATE TABLE "users" CASCADE')

    // Seed Users
    console.log('\nSeeding users...')
    const users: User[] = []
    for (const userData of defaultUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 10)
      const user = userRepo.create({
        email: userData.email,
        phone: userData.phone,
        passwordHash,
        role: userData.role as UserRole,
      })
      users.push(user)
    }
    await userRepo.save(users)
    console.log(`✓ Created ${users.length} users`)

    // Seed Main Categories
    console.log('\nSeeding categories...')
    const mainCategories: Record<string, Category> = {}
    const subCategories: Record<string, Category> = {}

    // Create main categories first
    const mainCategoryNames = ['Електроніка', 'Одяг', 'Книги', 'Дім та сад', 'Спорт та фітнес', 'Краса та догляд', 'Дитячі товари']
    for (const name of mainCategoryNames) {
      const category = categoryRepo.create({ name, description: `Категорія ${name}` })
      await categoryRepo.save(category)
      mainCategories[name] = category
    }
    console.log(`✓ Created ${mainCategoryNames.length} main categories`)

    // Create subcategories based on mapping
    for (const [csvName, mapping] of Object.entries(categoryMapping)) {
      if (mapping.parent && mainCategories[mapping.parent]) {
        // Check if subcategory already exists as main category
        if (!mainCategories[mapping.name]) {
          const subCategory = categoryRepo.create({
            name: mapping.name,
            description: `${mapping.name} - підкатегорія ${mapping.parent}`,
            parentId: mainCategories[mapping.parent].id,
          })
          await categoryRepo.save(subCategory)
          subCategories[csvName] = subCategory
        }
      } else if (mainCategories[mapping.name]) {
        // Map to existing main category
        subCategories[csvName] = mainCategories[mapping.name]
      }
    }
    console.log(`✓ Created ${Object.keys(subCategories).length} subcategories`)

    // Seed Attributes
    console.log('\nSeeding attributes...')
    const attributeMap: Record<string, Attribute> = {}
    for (const attrData of attributesSeedData) {
      const attribute = attributeRepo.create(attrData)
      await attributeRepo.save(attribute)
      attributeMap[attribute.slug] = attribute
    }
    console.log(`✓ Created ${attributesSeedData.length} attributes`)

    // Load and seed products from CSV files
    console.log('\nSeeding products from CSV files...')
    const mockDataDir = path.resolve(__dirname, '../../../../mock-data')
    const csvFiles = fs.readdirSync(mockDataDir).filter(f => f.endsWith('.csv'))

    let totalProducts = 0
    let totalProductAttributes = 0

    for (const csvFile of csvFiles) {
      const csvPath = path.join(mockDataDir, csvFile)
      const csvContent = fs.readFileSync(csvPath, 'utf-8')

      const parseResult = parse<CsvProduct>(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      if (parseResult.errors.length > 0) {
        console.warn(`  ⚠ Errors parsing ${csvFile}:`, parseResult.errors)
      }

      console.log(`  Processing ${csvFile} (${parseResult.data.length} products)...`)

      for (const row of parseResult.data) {
        try {
          // Find category
          const csvCategory = row['Category']
          let categoryId: number | null = null

          if (subCategories[csvCategory]) {
            categoryId = subCategories[csvCategory].id
          } else if (mainCategories[csvCategory]) {
            categoryId = mainCategories[csvCategory].id
          } else {
            // Try to find by Ukrainian name
            const mapping = categoryMapping[csvCategory]
            if (mapping) {
              const cat = await categoryRepo.findOne({ where: { name: mapping.name } })
              if (cat) categoryId = cat.id
            }
          }

          // Create product
          const product = productRepo.create({
            name: row['Product Name'],
            sku: row['SKU'],
            description: row['Description'],
            price: parseFloat(row['Price']),
            currency: row['Currency'] || 'UAH',
            stock: parseInt(row['Stock']) || 0,
            categoryId: categoryId ?? undefined,
            images: row['Image URL'] ? [row['Image URL']] : [],
          })

          await productRepo.save(product)
          totalProducts++

          // Parse and create product attributes
          if (row['Attributes']) {
            try {
              const attributes = JSON.parse(row['Attributes'])

              for (const [attrSlug, attrValue] of Object.entries(attributes)) {
                // Find attribute by slug
                const attribute = attributeMap[attrSlug]
                if (attribute) {
                  const productAttribute = productAttributeRepo.create({
                    productId: product.id,
                    attributeId: attribute.id,
                    value: attrValue,
                  })
                  await productAttributeRepo.save(productAttribute)
                  totalProductAttributes++
                }
              }
            } catch (e) {
              console.warn(`    ⚠ Error parsing attributes for ${row['SKU']}:`, e.message)
            }
          }
        } catch (e) {
          console.error(`    ✗ Error creating product ${row['SKU']}:`, e.message)
        }
      }
    }

    console.log(`\n✓ Created ${totalProducts} products`)
    console.log(`✓ Created ${totalProductAttributes} product attributes`)

    console.log('\n✅ Seed completed successfully!')
    console.log('\nDefault credentials:')
    defaultUsers.forEach((u: any) => {
      console.log(`  ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}: ${u.email} / ${u.password}`)
    })

    console.log('\nCategories created:')
    for (const [name, cat] of Object.entries(mainCategories)) {
      console.log(`  - ${name} (ID: ${cat.id})`)
    }
    for (const [csvName, cat] of Object.entries(subCategories)) {
      if (!Object.values(mainCategories).includes(cat)) {
        console.log(`    - ${cat.name} (CSV: ${csvName}, ID: ${cat.id})`)
      }
    }

  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await dataSource.destroy()
  }
}

// Run seed
seed()
