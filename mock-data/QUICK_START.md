# Quick Start Guide - CSV Product Import

## 🚀 Quick Import Steps

### 1. Access Import Page
```
http://localhost:10002/admin/products/import
```

### 2. Choose a CSV File
Start with one of these:
- ✅ **products-logitech.csv** (15 products, good for first test)
- ✅ **products-apple.csv** (15 Apple products)
- ✅ **products-samsung.csv** (15 Samsung products)

### 3. Upload & Map
The system will auto-detect columns. Default mapping:
```
Product Name → name
SKU → sku
Description → description
Price → price
Currency → currency
Stock → stock
Category → category (or categoryId)
Image URL → images
```

### 4. Import!
Click "Start Import" and wait for completion.

---

## 📦 Available Products Summary

| File | Products | Categories | Total Value | Best For |
|------|----------|------------|-------------|----------|
| **Apple** | 15 | Smartphones, Laptops, Tablets, Wearables, Smart Home | 660K UAH | Premium devices |
| **Samsung** | 15 | Smartphones, Laptops, Tablets, Monitors, Wearables | 580K UAH | Diverse catalog |
| **Sony** | 15 | Audio, Gaming, Cameras, TVs | 620K UAH | Entertainment |
| **Logitech** | 15 | Accessories, Gaming, Audio | 180K UAH | Peripherals |
| **Dell** | 15 | Laptops, Monitors, Desktops | 610K UAH | Computing |
| **HP** | 15 | Laptops, Monitors, Gaming, Printers | 430K UAH | Office & Gaming |
| **Razer** | 15 | Gaming Laptops, Peripherals | 540K UAH | Gaming |

---

## 🎯 Test Scenarios

### Scenario 1: Basic Import (5 min)
```bash
File: products-logitech.csv
Expected: 15 products successfully imported
```

### Scenario 2: Large Catalog (10 min)
```bash
Files: All 7 CSV files
Expected: 105 products total
```

### Scenario 3: Duplicate Handling
```bash
1. Import products-apple.csv
2. Import products-apple.csv again
Expected: Duplicate handling based on SKU
```

---

## 🔧 Column Mapping Examples

### Standard Mapping (Recommended)
```json
{
  "Product Name": "name",
  "SKU": "sku",
  "Description": "description",
  "Price": "price",
  "Currency": "currency",
  "Stock": "stock",
  "Category": "category",
  "Image URL": "images"
}
```

### Alternative Column Names
If your CSV has different headers:
```json
{
  "Name": "name",
  "Product Code": "sku",
  "Details": "description",
  "Cost": "price",
  "Available": "stock"
}
```

---

## 💾 Save as Template

After mapping columns, save as template for reuse:

1. **Template Name**: "Standard Product Import"
2. **Description**: "Default mapping for manufacturer CSVs"
3. Click **Save Template**

Next import will be faster!

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Category not found" | Create category first or use category ID |
| "Duplicate SKU" | Check profile duplicate handling settings |
| "Invalid price" | Remove currency symbols, use numbers only |
| Import shows 0 products | Check CSV encoding (UTF-8 recommended) |

---

## 📊 Expected Results

After importing all 7 files, you should have:

```
✅ 105 products total
✅ ~3,620,000 UAH inventory value
✅ 13 different categories
✅ Average 26 items per product
```

---

## 🎨 Product Categories

Make sure these exist before importing:
```
1. Smartphones
2. Laptops
3. Tablets
4. Accessories
5. Gaming
6. Wearables
7. Monitors
8. Audio
9. Cameras
10. TVs
11. Smart Home
12. Desktops
13. Printers
```

---

## 🚦 Import Status Indicators

- 🟢 **Green** = Successful import
- 🟡 **Yellow** = Skipped (duplicate)
- 🔴 **Red** = Failed (error)

---

## 📝 Quick Tips

1. **Start Small**: Import Logitech first (only 15 products)
2. **Check Results**: Review products in admin panel
3. **Save Template**: Don't re-map columns every time
4. **Backup First**: Export existing products before bulk import
5. **Test Category**: Ensure categories exist in database

---

## 🔄 Workflow Example

```
1. Login to admin panel
   ↓
2. Navigate to Products → Import
   ↓
3. Upload products-logitech.csv
   ↓
4. Verify column mapping
   ↓
5. Click "Continue to Preview"
   ↓
6. Review preview data
   ↓
7. Click "Start Import"
   ↓
8. Wait for completion (15/15 imported)
   ↓
9. Check Products list
   ✅ Success!
```

---

## 📞 Need Help?

Check the main `README.md` for detailed documentation.

---

**Ready to import? Start with `products-logitech.csv`! 🚀**
