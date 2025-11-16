# Nova Poshta Delivery Integration

This document describes the Nova Poshta API integration for delivery address selection in the checkout process.

## Overview

The system integrates with Nova Poshta API to provide:
- City search with autocomplete
- Warehouse/branch selection
- Delivery cost calculation
- Delivery time estimation
- Order delivery information storage

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
NOVA_POSHTA_API_KEY=your-nova-poshta-api-key
```

Get your API key from [Nova Poshta API Console](https://devcenter.novaposhta.ua/).

### Optional Configuration

For delivery cost calculation, you can set a default sender city:

```env
NEXT_PUBLIC_SENDER_CITY_REF=your-sender-city-ref
```

## Backend API

### Endpoints

#### 1. Search Cities
```
GET /delivery/cities/search?query=Київ&limit=10
```

Returns a list of cities matching the search query.

**Response:**
```json
[
  {
    "ref": "city-uuid",
    "mainDescription": "Київ",
    "area": "Київська область",
    "region": "Київський",
    "fullDescription": "Київ, Київська область"
  }
]
```

#### 2. Get Warehouses
```
GET /delivery/warehouses?cityRef=city-uuid&page=1&limit=50
```

Returns Nova Poshta warehouses for the specified city.

**Response:**
```json
[
  {
    "ref": "warehouse-uuid",
    "description": "Відділення №1: вул. Хрещатик, 1",
    "shortAddress": "вул. Хрещатик, 1",
    "number": "1",
    "cityRef": "city-uuid",
    "schedule": {...}
  }
]
```

#### 3. Search Streets
```
GET /delivery/streets/search?cityRef=city-uuid&query=Хрещатик&limit=20
```

Search for streets in a specific city (for courier delivery).

#### 4. Calculate Delivery Cost
```
GET /delivery/calculate?citySender=uuid&cityRecipient=uuid&weight=1&cost=1000&serviceType=WarehouseWarehouse
```

Calculate delivery cost based on sender city, recipient city, weight, and parcel cost.

#### 5. Get Delivery Time
```
GET /delivery/delivery-time?citySender=uuid&cityRecipient=uuid&serviceType=WarehouseWarehouse
```

Get estimated delivery time between two cities.

## Frontend Components

### DeliveryForm

The main component that combines city search, warehouse selection, and recipient information.

**Usage:**
```tsx
import { DeliveryForm, DeliveryFormData } from '@/components/delivery'

function CheckoutPage() {
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null)

  return (
    <DeliveryForm onDataChange={setDeliveryData} />
  )
}
```

**DeliveryFormData Structure:**
```typescript
interface DeliveryFormData {
  deliveryType: 'nova_poshta_warehouse'
  cityRef: string
  cityName: string
  warehouseRef: string
  warehouseDescription: string
  recipientName: string
  recipientPhone: string
}
```

### CitySearch

Autocomplete input for searching and selecting cities.

**Props:**
- `value: City | null` - Selected city
- `onChange: (city: City | null) => void` - Callback when city is selected
- `error?: string` - Error message to display

### WarehouseSelect

Dropdown for selecting a Nova Poshta warehouse.

**Props:**
- `cityRef: string | null` - Selected city reference
- `value: Warehouse | null` - Selected warehouse
- `onChange: (warehouse: Warehouse | null) => void` - Callback when warehouse is selected
- `error?: string` - Error message to display

## Database Schema

### Order Entity

The Order entity includes the following delivery fields:

```typescript
@Column({ name: 'delivery_type', nullable: true })
deliveryType: string

@Column({ name: 'delivery_city', nullable: true })
deliveryCity: string

@Column({ name: 'delivery_warehouse', nullable: true })
deliveryWarehouse: string

@Column({ name: 'delivery_address', nullable: true })
deliveryAddress: string

@Column({ name: 'recipient_name', nullable: true })
recipientName: string

@Column({ name: 'recipient_phone', nullable: true })
recipientPhone: string
```

### DeliveryAddress Entity

For storing user's saved delivery addresses:

```typescript
export enum DeliveryType {
  NOVA_POSHTA_WAREHOUSE = 'nova_poshta_warehouse',
  NOVA_POSHTA_COURIER = 'nova_poshta_courier',
  SELF_PICKUP = 'self_pickup',
}

@Entity('delivery_addresses')
export class DeliveryAddress {
  id: string
  userId: string
  type: DeliveryType
  cityRef: string
  cityName: string
  warehouseRef: string
  warehouseDescription: string
  recipientName: string
  recipientPhone: string
  isDefault: boolean
}
```

## Order Creation Flow

1. User fills in the delivery form on checkout page
2. Form validates all required fields (city, warehouse, recipient name, phone)
3. System calculates delivery cost and estimated time
4. User clicks "Оформити замовлення" (Complete Order)
5. Order is created with delivery information:
   ```typescript
   const orderData = {
     items: [...],
     deliveryType: 'nova_poshta_warehouse',
     deliveryCity: 'Київ',
     deliveryWarehouse: 'Відділення №1',
     recipientName: 'Іванов Іван Іванович',
     recipientPhone: '+380501234567'
   }
   ```
6. Order is saved to database with delivery fields
7. User is redirected to payment

## Validation

### Phone Number Validation

The system validates Ukrainian phone numbers in the format:
- `+380501234567`
- `380501234567`

Regex: `/^\+?380\d{9}$/`

### Required Fields

- City (must be selected from Nova Poshta list)
- Warehouse (must be selected from city's warehouses)
- Recipient Name (minimum 1 character, trimmed)
- Recipient Phone (must match validation regex)

## Future Enhancements

1. **Courier Delivery**: Add support for Nova Poshta courier delivery to specific addresses
2. **Saved Addresses**: Allow users to save frequently used delivery addresses
3. **Address Book**: Manage multiple delivery addresses in user profile
4. **Self Pickup**: Add option for self-pickup from store locations
5. **International Shipping**: Support for international deliveries

## Error Handling

The components include error handling for:
- Network failures when calling Nova Poshta API
- Invalid API responses
- Missing or invalid form data
- Rate limiting from Nova Poshta API

All errors are logged to console and user-friendly messages are displayed in the UI.

## Testing

To test the Nova Poshta integration:

1. Ensure `NOVA_POSHTA_API_KEY` is set in `.env`
2. Start the backend: `cd services/api && pnpm dev`
3. Start the frontend: `cd apps/web && pnpm dev`
4. Navigate to checkout page after adding items to cart
5. Try searching for cities (e.g., "Київ", "Львів", "Одеса")
6. Select a city and choose a warehouse
7. Fill in recipient information
8. Verify delivery cost and estimated time are displayed
9. Complete the order

## References

- [Nova Poshta API Documentation](https://devcenter.novaposhta.ua/)
- [Nova Poshta API Methods](https://devcenter.novaposhta.ua/docs/services/)
