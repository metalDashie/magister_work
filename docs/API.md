# API Documentation

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.fullmag.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## REST API Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "phone": "+380501234567"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /auth/login
Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as register

### Products

#### GET /products
List all products with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 999.99,
      "currency": "UAH",
      "stock": 10,
      "images": ["url1", "url2"],
      "category": {
        "id": 1,
        "name": "Category Name"
      }
    }
  ],
  "total": 100
}
```

#### GET /products/:id
Get single product by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "sku": "PROD-001",
  "description": "Detailed description",
  "price": 999.99,
  "currency": "UAH",
  "stock": 10,
  "images": ["url1", "url2"],
  "category": {
    "id": 1,
    "name": "Category Name"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### POST /products
Create new product (Admin/Manager only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "PROD-002",
  "description": "Product description",
  "price": 1299.99,
  "currency": "UAH",
  "stock": 50,
  "categoryId": 1,
  "images": ["url1", "url2"]
}
```

### Categories

#### GET /categories
List all categories with hierarchy.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "parentId": null,
    "children": [
      {
        "id": 2,
        "name": "Phones",
        "parentId": 1
      }
    ]
  }
]
```

### Cart

#### GET /cart
Get current user's cart.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "price": 999.99
      },
      "quantity": 2,
      "price": 999.99
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### POST /cart/items
Add item to cart.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

#### DELETE /cart/items/:id
Remove item from cart.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /cart/clear
Clear entire cart.

**Headers:** `Authorization: Bearer <token>`

### Orders

#### GET /orders
List user's orders.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "totalAmount": 1999.98,
    "status": "paid",
    "items": [
      {
        "id": "uuid",
        "product": {
          "name": "Product Name"
        },
        "quantity": 2,
        "price": 999.99
      }
    ],
    "payment": {
      "id": "uuid",
      "provider": "monobank",
      "status": "success"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /orders
Create new order from cart.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 999.99
    }
  ]
}
```

### Payments

#### POST /payments/invoice
Create payment invoice (Monobank).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "uuid",
  "amount": 1999.98,
  "currency": "UAH"
}
```

**Response:**
```json
{
  "invoiceId": "invoice_id",
  "pageUrl": "https://pay.monobank.ua/..."
}
```

### Webhooks

#### POST /webhook/monobank
Receive Monobank payment notifications (internal use).

#### POST /webhook/telegram
Receive Telegram bot updates (internal use).

## GraphQL API

GraphQL endpoint: `/graphql`

### Example Queries

#### Get Products

```graphql
query GetProducts {
  products {
    id
    name
    price
    category {
      name
    }
  }
}
```

#### Get User

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    role
    createdAt
  }
}
```

### Example Mutations

#### Login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    access_token
    user {
      id
      email
      role
    }
  }
}
```

Variables:
```json
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- **Anonymous**: 100 requests per 15 minutes
- **Authenticated**: 1000 requests per 15 minutes
- **Admin**: Unlimited

## Pagination

For paginated endpoints, use:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max: 100)

Response includes:
- `data`: Array of items
- `total`: Total count
- `page`: Current page
- `limit`: Items per page

## Webhooks

### Monobank Payment Webhook

Sent when payment status changes.

**Payload:**
```json
{
  "invoiceId": "invoice_id",
  "status": "success",
  "amount": 199998,
  "ccy": 980,
  "finalAmount": 199998,
  "createdDate": "2024-01-01T00:00:00Z",
  "modifiedDate": "2024-01-01T00:05:00Z"
}
```

**Status values:**
- `created` - Invoice created
- `processing` - Payment in progress
- `hold` - Payment on hold
- `success` - Payment successful
- `failure` - Payment failed
- `reversed` - Payment reversed

## Testing

Use the provided Postman collection or curl commands:

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Products
curl http://localhost:3001/api/products

# Get Cart (with auth)
curl http://localhost:3001/api/cart \
  -H "Authorization: Bearer <your_token>"
```
