import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CategoryProductList from '@/components/products/CategoryProductList'
import { generateMetadata as generateMeta } from '@/lib/metadata'

const apiUrl = process.env.API_URL || 'http://localhost:10001'

async function getCategory(id: string) {
  try {
    const res = await fetch(`${apiUrl}/api/categories/${id}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const category = await getCategory(params.id)

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  const productCount = category.products?.length || 0

  return generateMeta({
    title: category.name,
    description: `Browse ${productCount} products in ${category.name} category. Find quality products at FullMag with fast delivery.`,
    path: `/categories/${category.id}`,
    keywords: [category.name, 'category', 'products', 'shop', 'категорія'],
  })
}

export default async function CategoryPage({
  params,
}: {
  params: { id: string }
}) {
  const category = await getCategory(params.id)

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/categories" className="hover:text-primary-600">
          Categories
        </Link>
        {category.parent && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/categories/${category.parent.id}`}
              className="hover:text-primary-600"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>

      {category.description && (
        <p className="text-gray-600 text-lg mb-6">{category.description}</p>
      )}

      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Subcategories</h2>
          <div className="flex flex-wrap gap-3">
            {category.children.map((child: any) => (
              <Link
                key={child.id}
                href={`/categories/${child.id}`}
                className="bg-white border-2 border-gray-200 px-4 py-2 rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Products in {category.name}
        </h2>
      </div>

      <CategoryProductList categoryId={params.id} />
    </div>
  )
}
