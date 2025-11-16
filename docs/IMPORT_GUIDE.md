# Product Import Guide

## Overview

The advanced import system allows you to bulk import products from CSV files with:
- **Visual column mapping** - Drag & drop or select column mappings
- **Auto-detection** - Automatically suggests mappings based on header names
- **Profile templates** - Save mappings for reuse with different manufacturers
- **Preview & validation** - See what will be imported before committing
- **Import history** - Track all imports with detailed stats and error logs

---

## Getting Started

### 1. Install Required Packages

Run this command in the `services/api` directory:

```bash
pnpm add papaparse @types/papaparse @nestjs/platform-express @types/multer
```

### 2. Run Database Migrations

The import system adds two new tables:
- `import_profiles` - Stores saved column mapping templates
- `import_history` - Tracks all imports with stats and errors

Make sure TypeORM synchronization is enabled or run migrations.

### 3. Access the Import Tool

Navigate to: **Admin → Products → Import CSV**

URL: `http://localhost:3000/admin/products/import`

---

## CSV Format Requirements

### Required Columns:
- **Product Name** (or variations: name, title, product_name)
- **Price** (or variations: price, cost, unit_price)

### Recommended Columns:
- **SKU** - Product code for duplicate detection
- **Stock** - Inventory quantity
- **Description** - Product description
- **Category** - Category name or code
- **Images** - Comma-separated image URLs

### Supported Column Names

The system auto-detects these patterns (case-insensitive):

| Field | Recognized Names |
|-------|-----------------|
| Name | name, product_name, title, item_name, назва, товар |
| SKU | sku, code, article, артикул, model |
| Price | price, cost, unit_price, ціна, цена |
| Stock | stock, quantity, qty, available, кількість |
| Category | category, type, категорія |
| Images | image, img, photo, url, фото |

---

## Sample CSV Templates

### Basic Template
```csv
name,sku,price,stock,description
iPhone 15 Pro,IP15-128,45999,50,Latest Apple flagship smartphone
Samsung Galaxy S24,SGS24-256,38999,30,Premium Android device
MacBook Pro 16,MBP16-512,89999,15,Professional laptop for developers
```

### Full Template with Images
```csv
ProductName,SKU,Price,Stock,Category,Description,ImageURL
iPhone 15 Pro,IP15-128,45999,50,Smartphones,Latest flagship,https://example.com/iphone15.jpg
Samsung S24,SGS24-256,38999,30,Smartphones,Premium Android,https://example.com/s24.jpg
MacBook Pro,MBP16-512,89999,15,Laptops,M3 chip processor,https://example.com/macbook.jpg
```

### Manufacturer-Specific Templates

#### **Samsung Format**
```csv
ModelNumber,ProductName,UnitPrice,Quantity,CategoryCode,ImageURL
SM-S921,Galaxy S24 Ultra,49999,45,PHONES,https://samsung.com/s24.jpg
SM-F946,Galaxy Z Fold 5,59999,20,PHONES,https://samsung.com/fold5.jpg
```

#### **Generic Supplier Format**
```csv
article,product_name,cost,available,category,img
ART-001,Product Name,25999,100,Electronics,http://supplier.com/img1.jpg
ART-002,Another Product,15999,50,Home,http://supplier.com/img2.jpg
```

---

## Import Workflow

### Step 1: Upload File
1. Select an existing profile template OR use auto-detection
2. Choose your CSV file (max 10MB)
3. System parses and shows preview

### Step 2: Map Columns
- **Drag & Drop**: Drag CSV columns to system fields
- **Dropdown**: Use dropdown menus for each field
- **Auto-suggested**: System suggests mappings automatically
- **Save Template**: Save your mapping for future imports

### Step 3: Preview
- Review first 10-20 rows
- See validation stats (valid/invalid rows)
- Check for errors

### Step 4: Import
- Click "Start Import"
- System processes all rows
- See final stats and error details

---

## Creating Import Profiles

### Via UI (Recommended)
1. Upload a CSV file
2. Map columns manually
3. Click "Save as Template"
4. Name it (e.g., "Samsung Profile", "Supplier X Format")
5. Template saved for future use!

### Via API
```typescript
POST /import/profiles

{
  "name": "Samsung Import Profile",
  "description": "For Samsung product catalogs",
  "delimiter": ",",
  "encoding": "utf-8",
  "hasHeader": true,
  "columnMapping": {
    "name": "ProductName",
    "sku": "ModelNumber",
    "price": "UnitPrice",
    "stock": "Quantity",
    "category": "CategoryCode",
    "images": "ImageURL"
  },
  "validationRules": {
    "requireSKU": false,
    "allowDuplicateSKU": true,
    "minPrice": 0,
    "defaultCurrency": "UAH"
  }
}
```

---

## Advanced Features

### Price Transformations
```json
{
  "transformations": {
    "price": {
      "type": "multiply",
      "value": 100
    }
  }
}
```

Types:
- `multiply` - Multiply by value (e.g., convert hryvnias to kopiykas)
- `divide` - Divide by value
- `currency_convert` - Convert between currencies

### Category Mapping
```json
{
  "transformations": {
    "categoryMapping": {
      "PHONES": 1,
      "LAPTOPS": 2,
      "TABLETS": 3
    }
  }
}
```

Maps external category codes to your internal category IDs.

### Validation Rules
```json
{
  "validationRules": {
    "requireSKU": true,
    "allowDuplicateSKU": false,
    "minPrice": 100,
    "maxPrice": 1000000,
    "minStock": 0,
    "defaultCurrency": "UAH",
    "requiredFields": ["name", "price", "sku"]
  }
}
```

---

## API Endpoints

### Import Profiles
- `GET /import/profiles` - List all profiles
- `POST /import/profiles` - Create new profile
- `PUT /import/profiles/:id` - Update profile
- `DELETE /import/profiles/:id` - Delete profile

### Import Operations
- `POST /import/preview` - Preview CSV without importing
  - Multipart form: `file`, optional `profileId`
- `POST /import/execute` - Execute import
  - Multipart form: `file`, `profileId`

### Import History
- `GET /import/history` - List import history
- `GET /import/history/:id` - Get import details

---

## Troubleshooting

### Common Issues

**❌ "Failed to parse CSV file"**
- Check delimiter (comma vs semicolon)
- Verify encoding (UTF-8)
- Ensure first row has headers

**❌ "Required field missing"**
- Map both "name" and "price" fields
- Check column headers match expected names

**❌ "Permission denied"**
- Ensure user has admin or manager role
- Check JWT authentication

**❌ "Rows skipped: Duplicate SKU"**
- Enable `allowDuplicateSKU` in validation rules
- Or ensure unique SKUs in your CSV

### Error Logs

View detailed errors in import history:
`Admin → Products → Import → View History → [Select Import]`

---

## Best Practices

✅ **Test with small files first** (10-20 rows)
✅ **Save frequently-used mappings as templates**
✅ **Check preview before importing large files**
✅ **Use SKUs for duplicate detection**
✅ **Include stock quantities to avoid overselling**
✅ **Validate image URLs before import**
✅ **Review import history for errors**

---

## Examples

### Example 1: One-time Import
1. Upload CSV → Auto-detect mapping → Preview → Import
2. No template needed for one-time use

### Example 2: Regular Supplier Updates
1. First import: Map columns → Save as "Supplier X Template"
2. Future imports: Select "Supplier X Template" → Upload → Import
3. Mapping automatically applied!

### Example 3: Multiple Manufacturers
Create profiles for each:
- "Samsung Profile"
- "Apple Profile"
- "Generic Supplier"

Select appropriate profile when importing!

---

## Support

For issues or questions:
- Check `/admin/products/import` for UI
- Review import history for error details
- Ensure backend is running on port 3001

Happy importing! 🚀
