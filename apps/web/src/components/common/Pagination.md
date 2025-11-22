# Pagination Component

A reusable, accessible pagination component for navigating through large datasets.

## Features

- ✅ **Fully Accessible** - ARIA labels and keyboard navigation
- ✅ **Responsive Design** - Mobile-friendly with adaptive UI
- ✅ **Smart Page Numbers** - Shows ellipsis for large page counts
- ✅ **Customizable** - Control page numbers display and button count
- ✅ **TypeScript Support** - Full type safety
- ✅ **Auto-hide** - Hides when only one page exists

## Usage

### Basic Example

```tsx
import Pagination from '@/components/common/Pagination'

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalItems = 225
  const itemsPerPage = 20

  return (
    <Pagination
      currentPage={currentPage}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
    />
  )
}
```

### With Page Numbers

```tsx
<Pagination
  currentPage={currentPage}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  showPageNumbers={true}  // Shows 1, 2, 3, ... buttons
/>
```

### Custom Max Page Buttons

```tsx
<Pagination
  currentPage={currentPage}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  showPageNumbers={true}
  maxPageButtons={7}  // Show up to 7 page buttons
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current active page (1-indexed) |
| `totalItems` | `number` | - | Total number of items across all pages |
| `itemsPerPage` | `number` | - | Number of items to show per page |
| `onPageChange` | `(page: number) => void` | - | Callback when page changes |
| `showPageNumbers` | `boolean` | `true` | Whether to show numbered page buttons |
| `maxPageButtons` | `number` | `5` | Maximum number of page buttons to display |

## Features in Detail

### Smart Ellipsis

When there are many pages, the component intelligently shows ellipsis:

```
[1] [2] [3] ... [10] [11] [12]  // When on page 11
[1] ... [5] [6] [7] ... [15]     // When on page 6
```

### Responsive Behavior

**Desktop**:
- Shows all navigation elements
- Displays page numbers
- Previous/Next buttons with text

**Mobile**:
- Compact layout
- Shows "Page X of Y" instead of all numbers
- Icon-only Previous/Next buttons

### Auto-hide

The component automatically hides when:
- Total pages = 1
- Total items = 0
- Items fit on one page

### Accessibility

- Proper ARIA labels on all buttons
- `aria-current="page"` on active page
- Keyboard navigable
- Screen reader friendly

## Complete Integration Example

### Product List with Pagination

```tsx
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ProductCard from './ProductCard'
import Pagination from '@/components/common/Pagination'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    fetchProducts()
  }, [currentPage])

  const fetchProducts = async () => {
    const response = await api.get('/products', {
      params: { page: currentPage, limit: itemsPerPage },
    })
    setProducts(response.data.data)
    setTotal(response.data.total)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalItems={total}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          showPageNumbers={true}
        />
      </div>
    </>
  )
}
```

## Styling

The component uses Tailwind CSS classes. You can customize by:

1. **Editing the component directly** for global changes
2. **Wrapping in a div** with custom classes
3. **Using CSS modules** for scoped styles

### Custom Wrapper

```tsx
<div className="my-custom-pagination">
  <Pagination {...props} />
</div>
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance

- Renders only when props change
- Minimal re-renders with React hooks
- Lightweight (< 5KB)
- No external dependencies

## Common Patterns

### Scroll to Top on Page Change

```tsx
const handlePageChange = (newPage: number) => {
  setCurrentPage(newPage)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

### URL Sync

```tsx
const router = useRouter()
const searchParams = useSearchParams()

useEffect(() => {
  const pageFromUrl = parseInt(searchParams.get('page') || '1')
  setCurrentPage(pageFromUrl)
}, [searchParams])

const handlePageChange = (newPage: number) => {
  router.push(`?page=${newPage}`)
  setCurrentPage(newPage)
}
```

### Loading State

```tsx
{loading ? (
  <div>Loading...</div>
) : (
  <>
    <ProductGrid products={products} />
    <Pagination {...paginationProps} />
  </>
)}
```

## Where It's Used

Currently implemented on:

1. **Public Products Page** (`/products`)
   - Shows 20 products per page
   - Full pagination with page numbers

2. **Category Products Page** (`/categories/[id]`)
   - 20 products per page
   - Client-side pagination

3. **Admin Products Page** (`/admin/products`)
   - 20 products per page
   - With search functionality

4. **Orders Page** (`/profile/orders`)
   - 10 orders per page
   - User order history

## API Requirements

Your backend should support pagination parameters:

```
GET /api/products?page=1&limit=20

Response:
{
  "data": [...],      // Array of items for current page
  "total": 225,       // Total number of items
  "page": 1,          // Current page
  "limit": 20         // Items per page
}
```

## Tips

1. **Always validate page numbers** on the backend
2. **Cache results** when possible
3. **Show loading state** during fetches
4. **Scroll to top** when page changes
5. **Consider URL sync** for bookmarkable pages
6. **Handle edge cases** (empty results, errors)

## Troubleshooting

### Pagination doesn't show
- Check if `totalItems > itemsPerPage`
- Verify `totalItems` is correctly set

### Wrong page count
- Ensure `Math.ceil(totalItems / itemsPerPage)` is correct
- Check API response format

### Buttons disabled incorrectly
- Verify `currentPage` is 1-indexed, not 0-indexed
- Check boundary conditions

## Migration Guide

To add pagination to an existing list:

1. **Import Pagination**
```tsx
import Pagination from '@/components/common/Pagination'
```

2. **Add state**
```tsx
const [currentPage, setCurrentPage] = useState(1)
const [total, setTotal] = useState(0)
const itemsPerPage = 20
```

3. **Update fetch to use pagination**
```tsx
const response = await api.get('/endpoint', {
  params: { page: currentPage, limit: itemsPerPage }
})
setTotal(response.data.total)
```

4. **Add component**
```tsx
<Pagination
  currentPage={currentPage}
  totalItems={total}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
/>
```

Done! ✅
