# System Architecture

## Overview

FullMag is built using a microservices-inspired architecture with a monorepo structure, enabling code sharing and consistent development practices across all platforms.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
├──────────────┬──────────────────┬──────────────────────────┤
│  Web Browser │  iOS/Android     │  Desktop                 │
│  (Next.js)   │  (React Native)  │  (Future)                │
└──────┬───────┴─────────┬────────┴────────────┬─────────────┘
       │                 │                     │
       │                 └─────────┬───────────┘
       │                           │
       └───────────────────────────┼───────────────────────────┐
                                   │                           │
                         ┌─────────▼──────────┐                │
                         │   Load Balancer    │                │
                         │     (Nginx)        │                │
                         └─────────┬──────────┘                │
                                   │                           │
                         ┌─────────▼──────────┐                │
                         │    API Gateway      │                │
                         │   NestJS Backend    │                │
                         │  ┌──────────────┐  │                │
                         │  │   GraphQL    │  │                │
                         │  │     API      │  │                │
                         │  ├──────────────┤  │                │
                         │  │   REST API   │  │                │
                         │  └──────────────┘  │                │
                         └─────────┬──────────┘                │
                                   │                           │
        ┌──────────────────────────┼───────────────────┐       │
        │                          │                   │       │
┌───────▼────────┐      ┌──────────▼────────┐  ┌──────▼───────▼──┐
│   PostgreSQL   │      │      Redis        │  │   External APIs │
│   (Database)   │      │  (Cache/Queue)    │  │  - Monobank     │
└────────────────┘      └───────────────────┘  │  - SendGrid     │
                                               │  - TurboSMS     │
                                               │  - Telegram     │
                                               └─────────────────┘
```

## Layers

### 1. Presentation Layer

#### Web Application (Next.js)
- **SSR/SSG**: Server-side rendering for SEO
- **API Routes**: Backend for frontend pattern
- **Static Assets**: Optimized images and assets
- **Responsive Design**: Mobile-first approach

#### Mobile Application (React Native)
- **Native UI**: Platform-specific components
- **Offline Support**: AsyncStorage for local data
- **Push Notifications**: Firebase Cloud Messaging
- **Biometric Auth**: TouchID/FaceID support

### 2. API Layer (NestJS)

#### Modular Architecture

```
src/
├── modules/
│   ├── auth/           # Authentication & Authorization
│   ├── users/          # User Management
│   ├── products/       # Product Catalog
│   ├── categories/     # Product Categories
│   ├── cart/           # Shopping Cart
│   ├── orders/         # Order Management
│   ├── payments/       # Payment Processing
│   ├── notifications/  # Notification System
│   └── webhook/        # External Webhooks
├── database/
│   └── entities/       # TypeORM Entities
├── common/
│   ├── decorators/     # Custom Decorators
│   ├── guards/         # Auth Guards
│   ├── filters/        # Exception Filters
│   └── interceptors/   # Request/Response Interceptors
└── config/             # Configuration
```

### 3. Data Layer

#### PostgreSQL Database Schema

```sql
users
  ├── id (UUID, PK)
  ├── email (UNIQUE)
  ├── phone
  ├── password_hash
  ├── role (ENUM)
  └── timestamps

products
  ├── id (UUID, PK)
  ├── name
  ├── sku
  ├── description
  ├── price (DECIMAL)
  ├── currency
  ├── stock (INT)
  ├── category_id (FK)
  └── timestamps

categories
  ├── id (SERIAL, PK)
  ├── name
  └── parent_id (FK, self-reference)

carts
  ├── id (UUID, PK)
  ├── user_id (FK)
  └── timestamps

cart_items
  ├── id (UUID, PK)
  ├── cart_id (FK)
  ├── product_id (FK)
  ├── quantity (INT)
  └── price (DECIMAL)

orders
  ├── id (UUID, PK)
  ├── user_id (FK)
  ├── total_amount (DECIMAL)
  ├── status (ENUM)
  └── timestamps

order_items
  ├── id (UUID, PK)
  ├── order_id (FK)
  ├── product_id (FK)
  ├── quantity (INT)
  └── price (DECIMAL)

payments
  ├── id (UUID, PK)
  ├── order_id (FK)
  ├── provider (ENUM)
  ├── provider_payment_id
  ├── status (ENUM)
  ├── amount (DECIMAL)
  ├── currency
  └── timestamps

notifications
  ├── id (UUID, PK)
  ├── user_id (FK)
  ├── channel (ENUM)
  ├── payload (JSONB)
  ├── status (ENUM)
  └── timestamps
```

#### Redis Usage

1. **Caching**
   - Product listings
   - Category trees
   - User sessions

2. **Queue Management**
   - Email notifications
   - SMS sending
   - Telegram messages
   - Payment processing

### 4. Integration Layer

#### Payment Processing (Monobank)

```
User → Order Created → Payment Request
  ↓
Create Invoice (Monobank API)
  ↓
Return Payment URL → User Redirected
  ↓
User Completes Payment
  ↓
Webhook Received → Update Order Status
  ↓
Send Notification → User & Admin
```

#### Notification System

```
Event Triggered
  ↓
Queue Job Created (Redis/Bull)
  ↓
Worker Picks Up Job
  ↓
┌─────────────────┬─────────────────┬──────────────────┐
│ Email           │ SMS             │ Telegram         │
│ (SendGrid)      │ (TurboSMS)      │ (Bot API)        │
└─────────────────┴─────────────────┴──────────────────┘
  ↓
Update Notification Status
  ↓
Retry if Failed (with exponential backoff)
```

## Design Patterns

### 1. Repository Pattern
- Abstraction over data access
- TypeORM repositories for each entity
- Business logic separated from data access

### 2. Dependency Injection
- NestJS built-in DI container
- Loose coupling between modules
- Easy testing with mock dependencies

### 3. Middleware Pattern
- Request logging
- Authentication checks
- CORS handling
- Rate limiting

### 4. Observer Pattern
- Event-driven notifications
- Order status changes trigger events
- Payment webhooks emit events

### 5. Factory Pattern
- Payment provider factory
- Notification channel factory
- Database connection factory

## Security Architecture

### Authentication Flow

```
1. User Login → Credentials Verification
2. Generate JWT Token (Access + Refresh)
3. Store Refresh Token (Redis)
4. Return Tokens to Client
5. Client Stores Tokens (Secure Storage)
6. Request with Access Token → Verify JWT
7. Token Expired → Use Refresh Token
8. Logout → Invalidate Tokens
```

### Authorization

- **Role-Based Access Control (RBAC)**
  - USER: Browse, order, manage own data
  - MANAGER: Manage products, view orders
  - ADMIN: Full system access

- **Guards & Decorators**
  - `@UseGuards(JwtAuthGuard)`
  - `@Roles('admin', 'manager')`

### Data Protection

- **Passwords**: Bcrypt hashing (cost factor: 10)
- **Sensitive Data**: Encrypted at rest
- **API Communication**: TLS 1.3
- **Payment Data**: PCI DSS compliance (tokenization)

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers
- Load balancing with Nginx
- Session management via Redis

### Database Optimization

- Indexes on frequently queried fields
- Connection pooling
- Read replicas for reporting

### Caching Strategy

- **L1 Cache**: In-memory (application level)
- **L2 Cache**: Redis (distributed)
- **CDN**: Static assets (Cloudflare/AWS CloudFront)

### Queue Management

- Background job processing
- Retry mechanisms
- Dead letter queues for failed jobs

## Monitoring & Observability

### Logging

- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation

### Metrics

- Request rate
- Response time
- Error rate
- Database query performance

### Tracing

- Distributed tracing
- Request correlation IDs
- Performance bottleneck identification

## Deployment Architecture

### Development

```
Local Machine
  ├── Docker Compose (PostgreSQL, Redis)
  ├── API (pnpm dev)
  ├── Web (pnpm dev)
  └── Mobile (React Native CLI)
```

### Production

```
Cloud Infrastructure (AWS/Azure/GCP)
  ├── Load Balancer
  ├── Container Orchestration (Docker/Kubernetes)
  │   ├── API Instances (Multiple)
  │   ├── Web Instances (Multiple)
  │   └── Worker Instances
  ├── Managed PostgreSQL (RDS/Cloud SQL)
  ├── Managed Redis (ElastiCache/Redis Cloud)
  └── CDN (CloudFront/Cloudflare)
```

## Future Enhancements

1. **Microservices Migration**: Split API into independent services
2. **Event Sourcing**: Complete audit trail of all changes
3. **CQRS**: Separate read and write models
4. **GraphQL Subscriptions**: Real-time updates
5. **Elasticsearch**: Advanced search capabilities
6. **Message Broker**: RabbitMQ/Kafka for event streaming
7. **Service Mesh**: Istio for service-to-service communication
