# Mock Product CSV Files

This directory contains realistic mock product data from various manufacturers for testing the import functionality.

## Available Files

### 1. **products-apple.csv** (15 products)
Apple products including:
- iPhones (15 Pro Max, 15)
- MacBooks (Pro, Air)
- iPads (Pro, Air)
- AirPods (Pro 2, Max)
- Apple Watch (Series 9, Ultra 2)
- Accessories (Magic Keyboard, Magic Mouse, AirTag, HomePod)

**Total Value**: ~660,000 UAH

### 2. **products-samsung.csv** (15 products)
Samsung products including:
- Galaxy S24 series (Ultra, S24+)
- Foldables (Z Fold 5, Z Flip 5)
- Galaxy Books (laptops)
- Galaxy Tabs (tablets)
- Galaxy Watch & Buds
- Monitors (ViewFinity, Odyssey)
- SSDs and accessories

**Total Value**: ~580,000 UAH

### 3. **products-sony.csv** (15 products)
Sony products including:
- Premium headphones (WH-1000XM5, WH-1000XM4, WF-1000XM5)
- PlayStation 5 (Disc & Digital)
- Gaming accessories (DualSense Edge, Portal)
- Professional cameras (Alpha series, ZV-E1)
- Audio equipment (Soundbars, Speakers)
- BRAVIA TVs

**Total Value**: ~620,000 UAH

### 4. **products-logitech.csv** (15 products)
Logitech products including:
- MX series (Master 3S, Keys S, Anywhere 3S)
- Gaming gear (G PRO, G915 TKL)
- Webcams (StreamCam, Brio 4K)
- Microphones (Blue Yeti X, Blue Sona)
- iPad accessories
- Ergonomic mice

**Total Value**: ~180,000 UAH

### 5. **products-dell.csv** (15 products)
Dell products including:
- XPS laptops (15, 13 Plus)
- Alienware gaming laptops (m18, x14 R2)
- G-series gaming laptops
- UltraSharp monitors
- Alienware gaming monitors
- Accessories and docks

**Total Value**: ~610,000 UAH

### 6. **products-hp.csv** (15 products)
HP products including:
- Spectre & Elite business laptops
- OMEN & Victus gaming laptops
- Monitors (E-series, OMEN)
- HyperX gaming peripherals
- Accessories and docks
- OfficeJet printer

**Total Value**: ~430,000 UAH

### 7. **products-razer.csv** (15 products)
Razer gaming products including:
- Blade gaming laptops (16, 14)
- Gaming mice (DeathAdder V3 Pro, Viper V3 Pro)
- Mechanical keyboards (BlackWidow V4 Pro, Huntsman V3 Pro)
- Gaming headphones (BlackShark V2 Pro, Kraken V3)
- Webcam & Microphone
- Gaming monitors and chairs

**Total Value**: ~540,000 UAH

## CSV Format

All CSV files follow this format:

```csv
Product Name,SKU,Description,Price,Currency,Stock,Category,Image URL
```

### Column Descriptions

| Column | Description | Example |
|--------|-------------|---------|
| **Product Name** | Full product name | iPhone 15 Pro Max |
| **SKU** | Unique product identifier | APPLE-IP15PM-256-BLK |
| **Description** | Detailed product description in Ukrainian | Флагманський смартфон Apple з... |
| **Price** | Product price (numeric) | 54999 |
| **Currency** | Currency code | UAH |
| **Stock** | Available quantity | 25 |
| **Category** | Product category | Smartphones |
| **Image URL** | Product image URL | https://images.unsplash.com/... |

## Categories Used

The files use these category names:
- **Smartphones** - Mobile phones
- **Laptops** - Portable computers
- **Tablets** - Tablet devices
- **Accessories** - Peripherals, cables, cases, etc.
- **Gaming** - Gaming consoles, controllers, peripherals
- **Wearables** - Smartwatches, fitness trackers
- **Monitors** - Computer displays
- **Audio** - Speakers, microphones, soundbars
- **Cameras** - Digital cameras and camcorders
- **TVs** - Televisions
- **Smart Home** - Smart home devices
- **Desktops** - Desktop computers and All-in-Ones
- **Printers** - Printers and scanners

## Import Instructions

### Via Admin Panel

1. **Login** to admin panel:
   - URL: `http://localhost:10002/admin/products/import`
   - Use admin credentials

2. **Select Import Profile** (optional):
   - Choose existing profile or create new one

3. **Upload CSV File**:
   - Click "Drop your CSV file here, or click to browse"
   - Select one of the CSV files from this directory

4. **Map Columns**:
   - The system will auto-detect columns
   - Verify the mapping:
     - Product Name → name
     - SKU → sku
     - Description → description
     - Price → price
     - Currency → currency
     - Stock → stock
     - Category → categoryId (or category name)
     - Image URL → images

5. **Preview & Import**:
   - Review the preview
   - Click "Start Import"

6. **Wait for Completion**:
   - Monitor import progress
   - Check statistics (successful, failed, skipped)

### Recommended Import Order

1. Start with smaller files (Logitech, HP) for testing
2. Then import mid-size files (Dell, Razer, Sony)
3. Finally import larger files (Apple, Samsung)

## Notes

- All prices are in **Ukrainian Hryvnia (UAH)**
- Stock quantities are realistic for retail
- SKUs follow manufacturer-specific patterns
- Descriptions are in **Ukrainian language**
- Images use Unsplash placeholder URLs

## Image URLs

The CSV files use Unsplash stock images. These are placeholders and should be replaced with actual product images in production.

Example:
```
https://images.unsplash.com/photo-1632661674596-df8be070a5c5
```

## Category Mapping

Make sure these categories exist in your database before importing:
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

You can create categories via the admin panel or seed them in the database.

## Statistics

- **Total Products**: 105 items
- **Total Value**: ~3,620,000 UAH
- **Average Price**: ~34,476 UAH
- **Average Stock**: ~26 units per product
- **Manufacturers**: 7 brands

## Testing Scenarios

### Test 1: Single File Import
- Import `products-logitech.csv` (smallest file)
- Verify all 15 products imported correctly

### Test 2: Duplicate SKU Handling
- Import `products-apple.csv`
- Try importing again
- Check how system handles duplicates

### Test 3: Column Mapping
- Create custom column mapping profile
- Save as template
- Reuse for other files

### Test 4: Category Validation
- Import file with non-existent categories
- Verify error handling

### Test 5: Bulk Import
- Import all 7 files sequentially
- Verify total count (105 products)

## Troubleshooting

### Issue: Category not found
**Solution**: Create categories first or use category IDs instead of names

### Issue: Duplicate SKU
**Solution**: Check import profile settings for duplicate handling

### Issue: Invalid price format
**Solution**: Ensure prices are numeric without currency symbols

### Issue: Image not loading
**Solution**: Replace Unsplash URLs with actual product images

## Future Enhancements

- [ ] Add product variants (colors, sizes)
- [ ] Include product specifications
- [ ] Add multi-language support
- [ ] Include manufacturer warranty information
- [ ] Add product tags/keywords

## License

This mock data is for development and testing purposes only.
Product names and trademarks belong to their respective owners.
