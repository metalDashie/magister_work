# Setup Guide

This guide will walk you through setting up the FullMag project for development.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v20.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **pnpm** (v8.0.0 or higher)
   ```bash
   npm install -g pnpm
   # Verify
   pnpm --version
   ```

3. **Docker & Docker Compose**
   - Download Docker Desktop: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version` and `docker-compose --version`

4. **Git**
   - Download from: https://git-scm.com/
   - Verify: `git --version`

### Optional Software

- **PostgreSQL** (if not using Docker)
- **Redis** (if not using Docker)
- **Android Studio** (for React Native Android development)
- **Xcode** (for React Native iOS development, macOS only)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fullmag
```

### 2. Install Dependencies

```bash
# Install all dependencies for all packages
pnpm install
```

This will install dependencies for:
- Root workspace
- Web application
- Mobile application
- API server
- Common package

### 3. Environment Configuration

#### Backend API

```bash
cd services/api
cp .env.example .env
```

Edit `services/api/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database (use Docker values or your local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=fullmag

# Redis (use Docker values or your local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret (change in production!)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d

# Monobank (get from Monobank merchant dashboard)
MONOBANK_TOKEN=your-monobank-token
MONOBANK_API_URL=https://api.monobank.ua

# SendGrid (get from SendGrid dashboard)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@fullmag.com

# TurboSMS (get from TurboSMS)
TURBOSMS_API_KEY=your-turbosms-api-key
TURBOSMS_SENDER=FullMag

# Telegram Bot (get from @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhook/telegram

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### Web Application

```bash
cd apps/web
cp .env.example .env
```

Edit `apps/web/.env`:

```env
# API URL
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Payment
NEXT_PUBLIC_MONOBANK_PUBLIC_KEY=your_public_key
```

#### Mobile Application

```bash
cd apps/mobile
cp .env.example .env
```

Edit `apps/mobile/.env`:

```env
# API URL - use your machine's IP for physical devices
API_URL=http://10.0.2.2:3001/api  # For Android emulator
# API_URL=http://localhost:3001/api  # For iOS simulator
# API_URL=http://192.168.1.X:3001/api  # For physical devices
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)

Start PostgreSQL and Redis using Docker Compose:

```bash
# From project root
docker-compose up -d postgres redis

# Check if services are running
docker-compose ps
```

#### Option B: Local Installation

If you have PostgreSQL and Redis installed locally:

1. **PostgreSQL**: Create database
   ```bash
   createdb fullmag
   ```

2. **Redis**: Ensure Redis server is running
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### 5. Run Database Migrations

```bash
cd services/api

# Run migrations
pnpm migration:run

# If no migrations exist yet, TypeORM will auto-create tables in development
```

### 6. Seed Database (Optional)

Create a seed script if needed to populate initial data:

```bash
cd services/api
pnpm seed
```

## Running the Application

### Option 1: Using Docker (Full Stack)

Start all services with one command:

```bash
# From project root
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Access the applications:
- Web: http://localhost:3000
- API: http://localhost:3001
- GraphQL Playground: http://localhost:3001/graphql

### Option 2: Individual Development Servers

Run each service in a separate terminal:

**Terminal 1 - Backend API:**
```bash
pnpm dev:api
```

**Terminal 2 - Web Application:**
```bash
pnpm dev:web
```

**Terminal 3 - Mobile Application:**
```bash
pnpm dev:mobile

# For Android
pnpm --filter @fullmag/mobile android

# For iOS (macOS only)
pnpm --filter @fullmag/mobile ios
```

## Mobile App Setup

### Android Setup

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio

2. **Configure Android SDK**
   - Install Android SDK (API 33 or higher)
   - Set ANDROID_HOME environment variable

3. **Start Emulator or Connect Device**
   ```bash
   # List available emulators
   emulator -list-avds

   # Start emulator
   emulator -avd <emulator-name>

   # Or connect physical device with USB debugging enabled
   adb devices
   ```

4. **Run App**
   ```bash
   cd apps/mobile
   pnpm android
   ```

### iOS Setup (macOS only)

1. **Install Xcode**
   - Download from Mac App Store

2. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

3. **Install iOS dependencies**
   ```bash
   cd apps/mobile/ios
   pod install
   cd ..
   ```

4. **Run App**
   ```bash
   pnpm ios
   ```

## Verification

After setup, verify everything is working:

### 1. Check Backend Health

```bash
curl http://localhost:3001/api
```

### 2. Test Database Connection

```bash
# From services/api directory
pnpm typeorm query "SELECT NOW()"
```

### 3. Test Redis Connection

```bash
redis-cli ping
```

### 4. Access GraphQL Playground

Open browser: http://localhost:3001/graphql

Try a test query:
```graphql
query {
  __schema {
    queryType {
      name
    }
  }
}
```

### 5. Access Web Application

Open browser: http://localhost:3000

## Common Issues & Solutions

### Port Already in Use

If ports 3000, 3001, 5432, or 6379 are already in use:

1. Find and kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F

   # macOS/Linux
   lsof -ti:3001 | xargs kill -9
   ```

2. Or change ports in `.env` files

### Docker Issues

**Container fails to start:**
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start again
docker-compose up
```

**Permission issues (Linux):**
```bash
sudo chown -R $USER:$USER .
```

### pnpm Install Fails

```bash
# Clear pnpm cache
pnpm store prune

# Delete all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Delete lock file
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

### Database Connection Error

1. Check PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   # or
   pg_isready
   ```

2. Verify credentials in `.env`

3. Check network connectivity:
   ```bash
   telnet localhost 5432
   ```

### React Native Metro Bundler Issues

```bash
# Clear Metro bundler cache
pnpm --filter @fullmag/mobile start --reset-cache

# For Android, also clear build cache
cd apps/mobile/android
./gradlew clean
```

### TypeScript Errors

```bash
# Rebuild TypeScript references
pnpm -r build

# Check for type errors
pnpm -r type-check
```

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test:**
   ```bash
   # Run tests
   pnpm test

   # Run linter
   pnpm lint

   # Type check
   pnpm -r type-check
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

### Adding New Dependencies

```bash
# Add to root
pnpm add -w <package-name>

# Add to specific workspace
pnpm --filter @fullmag/api add <package-name>
pnpm --filter @fullmag/web add <package-name>
pnpm --filter @fullmag/mobile add <package-name>

# Add dev dependency
pnpm --filter @fullmag/api add -D <package-name>
```

### Database Migrations

```bash
cd services/api

# Create a new migration
pnpm typeorm migration:create src/database/migrations/YourMigrationName

# Generate migration from entity changes
pnpm migration:generate src/database/migrations/YourMigrationName

# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert
```

## IDE Setup

### Visual Studio Code

Recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript
- Docker
- GitLens
- React Native Tools (for mobile development)
- Jest Runner

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Next Steps

Once setup is complete:

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand system design
2. Review [API.md](./API.md) for API documentation
3. Check out the [README.md](../README.md) for project overview
4. Start developing!

## Getting Help

If you encounter issues:

1. Check this guide and documentation
2. Search existing GitHub issues
3. Create a new issue with:
   - Your environment (OS, Node version, etc.)
   - Steps to reproduce
   - Error messages and logs
   - What you've tried

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeORM Documentation](https://typeorm.io)
- [pnpm Documentation](https://pnpm.io)
