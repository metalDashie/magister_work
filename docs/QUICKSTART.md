# FullMag - Quick Start Guide ⚡

Get up and running in under 5 minutes!

## Prerequisites

- **Docker Desktop** (recommended): https://www.docker.com/
- OR **Node.js 20+** + **pnpm 8+** + **PostgreSQL 16** + **Redis** (for manual setup)

---

## 🚀 Option 1: Docker (Fastest - Recommended)

Just 3 commands:

```bash
# 1. Clone the repository
git clone <repository-url>
cd fullmag

# 2. Start everything with Docker
docker-compose -f docker-compose.dev.yml up -d

# 3. Monitor startup (first time takes ~2-3 min for dependencies)
docker logs -f fullmag-api
docker logs -f fullmag-web
```

**Done!** Access:
- 🌐 **Web App**: http://localhost:10002
- 🔧 **API**: http://localhost:10001
- 📊 **GraphQL**: http://localhost:10001/graphql
- 🐘 **PostgreSQL**: localhost:10050
- 🔴 **Redis**: localhost:10100

---

## 💻 Option 2: Manual Setup (Without Docker)

```bash
# 1. Clone and install
git clone <repository-url>
cd fullmag
pnpm install

# 2. Setup environment
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with correct values (see below)

# 3. Start PostgreSQL on port 10050 and Redis on port 10100
# (make sure they're running)

# 4. Start services (separate terminals)
pnpm dev:api                        # Terminal 1
cd apps/web && PORT=10002 pnpm dev  # Terminal 2
```

---

## 🔧 Environment Configuration (Manual Setup Only)

**Backend** (`services/api/.env`):
```env
PORT=10001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=10050
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=fullmag

REDIS_HOST=localhost
REDIS_PORT=10100

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:10002
FRONTEND_URL=http://localhost:10002

EMAIL_ENABLED=false
```

**Web** (`apps/web/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:10001
```

---

## 🎯 Testing the Application

1. **Open Web App**: http://localhost:10002
2. **Register Account**: Go to /auth/register
3. **Browse Products**: Navigate to /products
4. **Test API**: Open http://localhost:10001/graphql

## Project Structure

```
fullmag/
├── apps/
│   ├── web/              # Next.js web application (PORT 3000)
│   └── mobile/           # React Native mobile app
├── services/
│   └── api/              # NestJS backend API (PORT 3001)
├── packages/
│   └── common/           # Shared code and types
└── infra/                # Docker and deployment configs
```

---

## 📋 Common Commands

### Docker Commands

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
docker logs -f fullmag-api
docker logs -f fullmag-web

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Restart a service
docker-compose -f docker-compose.dev.yml restart api

# Complete cleanup (removes data!)
docker-compose -f docker-compose.dev.yml down -v

# Check status
docker-compose -f docker-compose.dev.yml ps
```

### Local Development Commands

```bash
# Start services
pnpm dev:api          # Start API on port 10001
pnpm dev:web          # Start web on port 10002
pnpm dev:mobile       # Start mobile app

# Build
pnpm build            # Build all projects

# Test
pnpm test             # Run all tests

# Lint
pnpm lint             # Lint all projects
```

## Features Implemented

### ✅ Authentication
- User registration
- Login/logout
- JWT-based authentication
- Protected routes

### ✅ Product Catalog
- Product listing with pagination
- Product details
- Categories and subcategories
- Search functionality
- Filter by category

### ✅ Shopping Cart
- Add/remove items
- Update quantities
- Persistent cart (local storage)
- Cart summary

### ✅ Checkout & Orders
- Order creation
- Order history
- Payment integration (Monobank)
- Order status tracking

### ✅ User Profile
- Profile information
- Order history
- Account management

---

## 🔧 Troubleshooting

**Services not starting?**
```bash
docker logs fullmag-api
docker logs fullmag-web
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

**Port conflicts?**
```bash
# Find what's using the port
lsof -i :10001              # macOS/Linux
netstat -ano | findstr :10001   # Windows
```

**Slow startup?**
- First run takes 2-5 minutes to install dependencies
- Subsequent starts are much faster

**TypeScript errors?**
```bash
rm -rf node_modules services/api/dist apps/web/.next
pnpm install
```

---

## 🔌 Key API Endpoints

Base URL: `http://localhost:10001/api`

- `POST /auth/register` - Register
- `POST /auth/login` - Login
- `GET /products` - List products
- `GET /cart` - Get cart
- `POST /cart/items` - Add to cart
- `POST /orders` - Create order

**Test API:**
```bash
# Register
curl -X POST http://localhost:10001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get products
curl http://localhost:10001/api/products
```

---

## 📚 Next Steps

1. **Full Documentation**: See [README.md](../README.md) for complete setup guide
2. **Features Documentation**: Check [FEATURES.md](FEATURES.md) for feature list
3. **Architecture**: Review project structure in README
4. **Customization**: Modify branding in `apps/web/tailwind.config.js`

---

## 🆘 Need More Help?

- **Detailed Setup**: [README.md](../README.md)
- **Features**: [FEATURES.md](FEATURES.md)
- **Troubleshooting**: See README.md → Troubleshooting section
- **Issues**: Create an issue in the repository

---

**Happy Shopping! 🛍️**

*This project is created for educational purposes as part of a master's thesis.*
