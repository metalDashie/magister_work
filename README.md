# FullMag - Multi-Platform E-Commerce System

A comprehensive multi-platform e-commerce system built with modern technologies, supporting web, mobile (iOS/Android), and desktop platforms.

## Project Overview

This is a master's thesis project that demonstrates the development of a multi-platform online store system using:

- **Web**: Next.js 14 with SSR for SEO optimization
- **Mobile**: React Native for iOS and Android
- **Backend**: NestJS with GraphQL and REST APIs
- **Database**: PostgreSQL with TypeORM
- **Cache/Queue**: Redis with Bull
- **Payment**: Monobank integration
- **Notifications**: Email (SendGrid), SMS (TurboSMS), Telegram

## Architecture

The project follows a monorepo structure using pnpm workspaces:

```
fullmag/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native mobile app
├── packages/
│   └── common/           # Shared types, utilities, and business logic
├── services/
│   └── api/              # NestJS backend API
└── infra/                # Infrastructure and deployment configs
```

## Technology Stack

### Frontend
- **Next.js 14**: Server-side rendering, static generation
- **React Native**: Native mobile applications
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling (web)
- **Zustand**: State management

### Backend
- **NestJS**: Enterprise-grade Node.js framework
- **TypeORM**: Database ORM
- **GraphQL + Apollo**: Flexible API queries
- **REST API**: Traditional endpoints for simple operations
- **Bull**: Queue management with Redis
- **Passport + JWT**: Authentication

### Database & Cache
- **PostgreSQL**: Primary database
- **Redis**: Caching and message queue

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Local development orchestration
- **GitHub Actions**: CI/CD pipeline
- **pnpm**: Fast, efficient package management

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis (or use Docker)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd fullmag
pnpm install
```

### 2. Environment Configuration

Copy environment files and configure:

```bash
# Backend
cp services/api/.env.example services/api/.env

# Web
cp apps/web/.env.example apps/web/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Services will be available at:
- Web: http://localhost:3000
- API: http://localhost:3001
- GraphQL Playground: http://localhost:3001/graphql
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. Start Development (Without Docker)

```bash
# Terminal 1 - Start PostgreSQL and Redis
# (Make sure they're running)

# Terminal 2 - Start API
pnpm dev:api

# Terminal 3 - Start Web
pnpm dev:web

# Terminal 4 - Start Mobile
pnpm dev:mobile
```

## Project Structure

### Web Application (`apps/web`)

Next.js application with:
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes
- Tailwind CSS styling
- TypeScript

### Mobile Application (`apps/mobile`)

React Native application with:
- Cross-platform (iOS/Android)
- Native navigation
- Offline-first architecture
- AsyncStorage for local data
- TypeScript

### Backend API (`services/api`)

NestJS application with modules:
- **Auth**: JWT authentication, user registration/login
- **Users**: User management
- **Products**: Product catalog with categories
- **Cart**: Shopping cart functionality
- **Orders**: Order management
- **Payments**: Monobank payment integration
- **Notifications**: Omnichannel notifications (Email, SMS, Telegram)
- **Webhook**: Payment and external service webhooks

### Shared Package (`packages/common`)

Common code shared across all applications:
- Type definitions (Zod schemas)
- Validation utilities
- Formatting helpers
- API route constants

## Key Features

### E-Commerce Core
- Product catalog with categories
- Shopping cart
- Order management
- User authentication and profiles
- Search and filtering

### Payment Integration
- Monobank payment gateway
- Secure payment processing
- Webhook handling
- Order status updates

### Notifications
- Email notifications (SendGrid)
- SMS notifications (TurboSMS)
- Telegram bot integration
- Queue-based async processing

### Multi-Platform
- Responsive web design
- Native mobile apps (iOS/Android)
- Consistent UX across platforms
- Shared business logic

## Development

### Available Scripts

```bash
# Development
pnpm dev:web          # Start web app
pnpm dev:api          # Start API server
pnpm dev:mobile       # Start mobile app

# Build
pnpm build            # Build all projects

# Test
pnpm test             # Run all tests

# Lint
pnpm lint             # Lint all projects

# Clean
pnpm clean            # Clean build artifacts
```

### Database Migrations

```bash
cd services/api

# Generate migration
pnpm migration:generate -n MigrationName

# Run migrations
pnpm migration:run

# Revert migration
pnpm migration:revert
```

## Deployment

### Production Docker Build

```bash
# Build production images
docker-compose -f infra/docker-compose.prod.yml build

# Start production services
docker-compose -f infra/docker-compose.prod.yml up -d
```

### Environment Variables

Required environment variables for production:

**Backend:**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `REDIS_HOST`, `REDIS_PORT`
- `JWT_SECRET`
- `MONOBANK_TOKEN`
- `SENDGRID_API_KEY`
- `TURBOSMS_API_KEY`
- `TELEGRAM_BOT_TOKEN`

**Web:**
- `NEXT_PUBLIC_API_URL`

## API Documentation

### REST API

Available at: `http://localhost:3001/api`

Key endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `POST /api/orders` - Create order
- `POST /api/payments/invoice` - Create payment invoice
- `POST /api/webhook/monobank` - Monobank webhook

### GraphQL API

GraphQL Playground: `http://localhost:3001/graphql`

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @fullmag/api test
pnpm --filter @fullmag/web test
```

## Contributing

This is a master's thesis project. For development:

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Create a pull request

## License

This project is created for educational purposes as part of a master's thesis.

## Author

Master's Thesis Project
Subject: Development of Multi-Platform E-Commerce System

## Acknowledgments

- Next.js documentation and community
- NestJS documentation and community
- React Native documentation and community
- All open-source contributors

## Project Status

Active development - Master's thesis implementation

## Support

For questions or issues, please create an issue in the repository.
