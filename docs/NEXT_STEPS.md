# Next Steps - Feature Implementation Priority

**Quick Reference for Development Roadmap**

---

## 🔥 CRITICAL - FIX IMMEDIATELY

### 1. Fix Broken Cart Update (4 hours)
**Status**: 🔴 BROKEN - Users cannot change cart quantities

**What to do**:
```bash
# Add to: services/api/src/modules/cart/cart.controller.ts

@Put('items/:id')
async updateItem(
  @Request() req,
  @Param('id') itemId: string,
  @Body() updateDto: { quantity: number }
) {
  return this.cartService.updateItemQuantity(req.user.userId, itemId, updateDto.quantity)
}
```

**Files**:
- `services/api/src/modules/cart/cart.controller.ts` - Add endpoint
- `services/api/src/modules/cart/cart.service.ts` - Add method

---

## 🎯 SPRINT 1 - Essential Filtering (Week 1)

### 2. Product Filtering (16 hours)
**Features**:
- Filter by price range (min/max)
- Filter by category
- Filter by stock status
- Filter by brand

**Backend**:
```typescript
// services/api/src/modules/products/products.controller.ts
@Get()
findAll(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('search') search?: string,
  @Query('minPrice') minPrice?: number,
  @Query('maxPrice') maxPrice?: number,
  @Query('categoryId') categoryId?: number,
  @Query('inStock') inStock?: boolean,
) {
  return this.productsService.findAll({
    page, limit, search, minPrice, maxPrice, categoryId, inStock
  })
}
```

**Frontend**:
- Create `apps/web/src/components/products/FilterSidebar.tsx`
- Update `apps/web/src/components/products/ProductList.tsx`

---

### 3. Product Sorting (8 hours)
**Features**:
- Sort by price (low→high, high→low)
- Sort by name (A-Z, Z-A)
- Sort by newest/oldest

**Backend**:
```typescript
// services/api/src/modules/products/products.service.ts
@Query('sortBy') sortBy?: 'price' | 'name' | 'createdAt',
@Query('sortOrder') sortOrder?: 'ASC' | 'DESC',

// Replace hardcoded:
order: { createdAt: 'DESC' }

// With dynamic:
order: { [sortBy || 'createdAt']: sortOrder || 'DESC' }
```

**Frontend**:
- Create `apps/web/src/components/products/SortDropdown.tsx`

---

## 📋 SPRINT 2 - User Management (Week 2)

### 4. Profile Editing (12 hours)
**Features**:
- Edit email, phone, name
- Update profile information
- Avatar upload (optional)

**Create**:
- `services/api/src/modules/users/dto/update-profile.dto.ts`
- Add `PUT /users/profile` endpoint
- Update `apps/web/src/app/profile/page.tsx` with edit mode

---

### 5. Password Reset (16 hours)
**Features**:
- Forgot password page
- Email with reset link
- Reset password page
- Token validation

**Create**:
- `services/api/src/modules/auth/dto/forgot-password.dto.ts`
- `services/api/src/modules/auth/dto/reset-password.dto.ts`
- `POST /auth/forgot-password` endpoint
- `POST /auth/reset-password` endpoint
- `apps/web/src/app/auth/forgot-password/page.tsx`
- `apps/web/src/app/auth/reset-password/page.tsx`

---

## 📦 SPRINT 3 - Order Experience (Week 3)

### 6. Order Detail Page (12 hours)
**Features**:
- Individual order view
- Order status timeline
- Delivery tracking
- Invoice download (PDF)

**Create**:
- `apps/web/src/app/profile/orders/[id]/page.tsx`
- Backend endpoint already exists (`GET /orders/:id`)

---

### 7. Email Notifications (16 hours)
**Features**:
- Order confirmation email
- Order status update emails
- Payment confirmation
- Delivery notifications

**Modify**:
- `services/api/src/modules/orders/orders.service.ts`
- `services/api/src/modules/payments/payments.service.ts`
- Hook email service into order/payment flows

**Create Email Templates**:
- `services/api/src/modules/email/templates/order-confirmation.html`
- `services/api/src/modules/email/templates/order-status-update.html`
- `services/api/src/modules/email/templates/payment-confirmation.html`

---

## 🖼️ SPRINT 4 - Product Enhancement (Week 4)

### 8. Product Image Gallery (12 hours)
**Features**:
- Display all product images
- Image thumbnails
- Image navigation
- Zoom functionality

**Modify**:
- `apps/web/src/app/products/[id]/page.tsx`

**Create**:
- `apps/web/src/components/products/ImageGallery.tsx`

---

## 🎁 MONTH 2 - Enhanced Features

### 9. Wishlist/Favorites (24 hours)
**Database**:
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP
);
```

**Create**:
- `services/api/src/database/entities/wishlist.entity.ts`
- `services/api/src/modules/wishlist/` (full module)
- `apps/web/src/lib/store/wishlistStore.ts`
- `apps/web/src/app/profile/wishlist/page.tsx`

---

### 10. Product Reviews & Ratings (32 hours)
**Database**:
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

**Create**:
- `services/api/src/database/entities/review.entity.ts`
- `services/api/src/modules/reviews/` (full module)
- `apps/web/src/components/reviews/ReviewList.tsx`
- `apps/web/src/components/reviews/ReviewForm.tsx`
- `apps/web/src/components/reviews/StarRating.tsx`

---

### 11. Advanced Search (24 hours)
**Features**:
- Autocomplete suggestions
- Search history
- Popular searches
- "Did you mean?" suggestions

**Create**:
- `apps/web/src/components/search/SearchAutocomplete.tsx`
- Enhanced search service

---

### 12. Discount Codes/Promotions (24 hours)
**Database**:
```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(20), -- 'percentage', 'fixed', 'free_shipping'
  discount_value DECIMAL,
  min_order_amount DECIMAL,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);
```

**Create**:
- `services/api/src/database/entities/promo-code.entity.ts`
- `services/api/src/modules/promo-codes/` (full module)
- `apps/web/src/app/admin/promo-codes/page.tsx`
- Add promo code input to cart/checkout

---

## 📊 Development Timeline

```
Week 1 (Sprint 1): Critical Fixes + Filtering/Sorting
├─ Day 1: Fix cart update endpoint
├─ Day 2-3: Product filtering
└─ Day 4: Product sorting

Week 2 (Sprint 2): User Management
├─ Day 1-2: Profile editing
└─ Day 3-5: Password reset

Week 3 (Sprint 3): Order Experience
├─ Day 1-2: Order detail page
└─ Day 3-5: Email notifications

Week 4 (Sprint 4): Product Enhancement
└─ Day 1-3: Product image gallery

Month 2: Enhanced Features
├─ Week 5-6: Wishlist + Reviews
├─ Week 7: Advanced search
└─ Week 8: Discount codes
```

---

## 🎯 Quick Wins (Do First)

These provide maximum impact with minimum effort:

1. ✅ **Fix cart update** (4h) - Fixes broken feature
2. ✅ **Product sorting** (8h) - Easy backend + simple UI
3. ✅ **Email notifications** (16h) - Module exists, just integrate
4. ✅ **Product image gallery** (12h) - Entity supports it, just show UI
5. ✅ **Order detail page** (12h) - Endpoint exists, just create page

**Total**: 52 hours (6.5 days) = Major improvements

---

## 💰 ROI Priority

**Highest ROI (Do These First)**:
1. Product filtering/sorting - Users find products faster
2. Reviews & ratings - Builds trust, increases conversions
3. Discount codes - Marketing tool, drives sales
4. Email notifications - Reduces support load
5. Wishlist - Reduces cart abandonment

---

## 🔍 Testing Checklist

After implementing each feature, verify:

- [ ] Backend endpoint works (Postman/Insomnia)
- [ ] Frontend UI responsive (mobile/desktop)
- [ ] Error handling (edge cases)
- [ ] Authentication/authorization
- [ ] Database migrations run
- [ ] TypeScript types updated
- [ ] No console errors
- [ ] Performance (< 2s load time)

---

## 📚 Additional Resources

**Full Analysis**: See `STORE_FEATURES_ANALYSIS.md`
**Pagination Docs**: See `PAGINATION_IMPLEMENTATION.md`
**Image Component Docs**: See `apps/web/src/components/common/Pagination.md`

---

**Last Updated**: 2025-11-16
