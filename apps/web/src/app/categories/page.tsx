import Link from 'next/link'
import { Metadata } from 'next'
import { generateMetadata as generateMeta } from '@/lib/metadata'

const apiUrl = process.env.API_URL || 'http://localhost:3001'

export const metadata: Metadata = generateMeta({
  title: 'Categories',
  description:
    'Browse all product categories at FullMag. Find the perfect category for your shopping needs.',
  path: '/categories',
  keywords: ['categories', 'browse', 'shop by category', 'категорії'],
})

async function getCategories() {
  try {
    const res = await fetch(`${apiUrl}/api/categories`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })

    if (!res.ok) {
      return []
    }

    return res.json()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Categories</h1>

      {categories.length === 0 ? (
        <p className="text-gray-600">No categories available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: any) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {category.description}
                </p>
              )}
              {category.children && category.children.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Subcategories:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {category.children.slice(0, 3).map((child: any) => (
                      <li key={child.id}>{child.name}</li>
                    ))}
                    {category.children.length > 3 && (
                      <li className="text-primary-600">
                        +{category.children.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
