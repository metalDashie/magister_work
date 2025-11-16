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

Follow these steps to set up the project on a new machine:

### Quick Start (Recommended - Docker)

If you have Docker installed, this is the fastest way to get started:

```bash
# 1. Clone the repository
git clone <repository-url>
cd fullmag

# 2. Start all services with Docker
docker-compose -f docker-compose.dev.yml up -d

# 3. Wait for services to start (first time takes ~2-3 minutes for dependency installation)
# Check logs to monitor progress:
docker logs -f fullmag-api
docker logs -f fullmag-web
```

**That's it!** Services will be available at:
- 🌐 **Web App**: http://localhost:10002
- 🔧 **API**: http://localhost:10001
- 📊 **GraphQL Playground**: http://localhost:10001/graphql
- 🐘 **PostgreSQL**: localhost:10050
- 🔴 **Redis**: localhost:10100

---

### Manual Setup (Without Docker)

If you prefer to run services locally without Docker:

#### Step 1: Install Prerequisites

Make sure you have installed:
- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL** 16 ([Download](https://www.postgresql.org/download/))
- **Redis** ([Download](https://redis.io/download/))

#### Step 2: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd fullmag

# Install all dependencies (this may take a few minutes)
pnpm install
```

#### Step 3: Setup Database

```bash
# Create PostgreSQL database
createdb fullmag

# Or using psql:
psql -U postgres
CREATE DATABASE fullmag;
\q
```

#### Step 4: Configure Environment Variables

```bash
# Copy environment files
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env
```

**Edit `services/api/.env`** and update the following:

```env
# Server
PORT=10001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=10050
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=fullmag

# Redis
REDIS_HOST=localhost
REDIS_PORT=10100

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:10002
FRONTEND_URL=http://localhost:10002

# Email (optional for development)
EMAIL_ENABLED=false
```

**Edit `apps/web/.env`** and update:

```env
NEXT_PUBLIC_API_URL=http://localhost:10001
```

#### Step 5: Start Services

Open **3 separate terminal windows**:

**Terminal 1 - Start API:**
```bash
pnpm dev:api
```
Wait for: `Nest application successfully started`

**Terminal 2 - Start Web App:**
```bash
cd apps/web
PORT=10002 pnpm dev
```
Wait for: `Ready in X.Xs`

**Terminal 3 - Start PostgreSQL & Redis:**
```bash
# Make sure PostgreSQL is running on port 10050
# Make sure Redis is running on port 10100

# On macOS/Linux:
redis-server --port 10100

# On Windows:
redis-server --port 10100
```

---

### Verify Installation

Once services are running, verify everything works:

1. **API Health Check:**
   ```bash
   curl http://localhost:10001
   ```

2. **Web App:**
   Open http://localhost:10002 in your browser

3. **GraphQL Playground:**
   Open http://localhost:10001/graphql in your browser

4. **Database Connection:**
   ```bash
   psql -h localhost -p 10050 -U postgres -d fullmag
   ```

---

### Common Commands

#### Using Docker:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down

# View logs (all services)
docker-compose -f docker-compose.dev.yml logs -f

# View logs (specific service)
docker logs -f fullmag-api
docker logs -f fullmag-web
docker logs -f fullmag-postgres
docker logs -f fullmag-redis

# Restart a service
docker-compose -f docker-compose.dev.yml restart api
docker-compose -f docker-compose.dev.yml restart web

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build

# Stop and remove everything (including volumes/data)
docker-compose -f docker-compose.dev.yml down -v

# Check service status
docker-compose -f docker-compose.dev.yml ps
```

#### Using pnpm (without Docker):

```bash
# Development
pnpm dev:web          # Start web app on port 10002
pnpm dev:api          # Start API server on port 10001
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

Available at: `http://localhost:10001/api`

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

GraphQL Playground: `http://localhost:10001/graphql`

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

## Troubleshooting

### Common Issues

#### Docker Issues

**Problem: Containers won't start or crash**
```bash
# Check logs for errors
docker logs fullmag-api
docker logs fullmag-web

# Try rebuilding
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

**Problem: Port already in use**
```bash
# Find what's using the port (example for port 10001)
# On macOS/Linux:
lsof -i :10001

# On Windows:
netstat -ano | findstr :10001

# Kill the process or change the port in docker-compose.dev.yml
```

**Problem: Slow dependency installation**
- First run takes 2-5 minutes to install all dependencies
- Use `docker logs -f fullmag-api` to monitor progress
- Subsequent starts are much faster

#### Local Development Issues

**Problem: TypeScript compilation errors**
```bash
# Clean and rebuild
rm -rf node_modules
rm -rf services/api/dist
rm -rf apps/web/.next
pnpm install
pnpm build
```

**Problem: Database connection refused**
```bash
# Make sure PostgreSQL is running on the correct port
psql -h localhost -p 10050 -U postgres

# Check your .env file has correct DB settings
cat services/api/.env | grep DB_
```

**Problem: Redis connection issues**
```bash
# Test Redis connection
redis-cli -p 10100 ping
# Should return: PONG

# Start Redis on correct port if not running
redis-server --port 10100
```

**Problem: API won't start - "bcrypt" error**
```bash
# Rebuild native modules
cd services/api
pnpm rebuild bcrypt
```

**Problem: Web app shows "API connection failed"**
- Make sure API is running on port 10001
- Check CORS settings in `services/api/.env`:
  ```env
  CORS_ORIGIN=http://localhost:10002
  ```
- Verify `apps/web/.env` has correct API URL:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:10001
  ```

#### Permission Issues

**Problem: Permission denied errors**
```bash
# On macOS/Linux, fix permissions:
sudo chown -R $USER:$USER .

# Or run with sudo for Docker:
sudo docker-compose -f docker-compose.dev.yml up -d
```

### Getting Help

If you encounter issues not covered here:

1. Check the logs:
   - Docker: `docker logs fullmag-api` or `docker logs fullmag-web`
   - Local: Check the terminal output

2. Verify environment configuration:
   ```bash
   # Check API environment
   cat services/api/.env

   # Check Web environment
   cat apps/web/.env
   ```

3. Clean start:
   ```bash
   # With Docker
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d --build

   # Without Docker
   rm -rf node_modules
   pnpm install
   ```

4. Create an issue in the repository with:
   - Error message
   - Steps to reproduce
   - System information (OS, Node version, Docker version)

## Support

For questions or issues, please create an issue in the repository.
