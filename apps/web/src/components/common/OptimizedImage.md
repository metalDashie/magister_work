# OptimizedImage Component

A reusable image component with automatic error handling and placeholder support for corrupted or missing images.

## Features

- ✅ Automatic error handling for broken/missing images
- ✅ Beautiful placeholders with context-specific icons
- ✅ Lazy loading for performance
- ✅ TypeScript support
- ✅ Multiple content types (product, category, avatar, general)
- ✅ Customizable object-fit options

## Usage

### Basic Usage

```tsx
import OptimizedImage from '@/components/common/OptimizedImage'

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Product name"
  className="w-full h-64"
  contentType="product"
/>
```

### Product Image

```tsx
<OptimizedImage
  src={product.images?.[0]}
  alt={product.name}
  className="w-full h-48"
  contentType="product"
  objectFit="cover"
/>
```

### Category Image

```tsx
<OptimizedImage
  src={category.image}
  alt={category.name}
  className="w-32 h-32 rounded-lg"
  contentType="category"
  objectFit="contain"
/>
```

### Avatar/Profile Image

```tsx
<OptimizedImage
  src={user.avatar}
  alt={user.name}
  className="w-16 h-16 rounded-full"
  contentType="avatar"
  objectFit="cover"
/>
```

### General Image

```tsx
<OptimizedImage
  src="/banner.jpg"
  alt="Banner"
  className="w-full"
  contentType="general"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string \| null \| undefined` | - | Image URL (required) |
| `alt` | `string` | - | Alt text for accessibility (required) |
| `className` | `string` | `''` | Additional CSS classes |
| `width` | `number` | - | Image width in pixels |
| `height` | `number` | - | Image height in pixels |
| `contentType` | `'product' \| 'category' \| 'avatar' \| 'general'` | `'general'` | Type of content (affects placeholder icon) |
| `objectFit` | `'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'` | How image should be resized |

## Placeholder Icons

Each content type has a specific placeholder icon:

- **Product**: 3D box/package icon
- **Category**: Grid/folder icon
- **Avatar**: User/person icon
- **General**: Image/photo icon

## Error Handling

The component automatically:
1. Detects when an image fails to load
2. Shows a beautiful placeholder with an appropriate icon
3. Displays context-specific text (e.g., "No Product Image")
4. Updates if the `src` prop changes

## Performance

- Images are lazy-loaded by default
- Placeholders are rendered with CSS gradients (no external images)
- SVG icons are inline for instant rendering
