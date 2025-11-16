# FullMag Local Development Setup

This guide shows how to run infrastructure in Docker and applications from terminal.

## 1. Start Infrastructure Services (Postgres & Redis)

```bash
# Start postgres and redis
docker-compose -f docker-compose.infra.yml up -d

# Verify they're running
docker-compose -f docker-compose.infra.yml ps

# Check postgres is ready
docker exec fullmag-postgres pg_isready -U postgres

# Check redis is ready
docker exec fullmag-redis redis-cli ping
```

## 2. Install Dependencies (First Time Only)

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install all dependencies from project root
pnpm install
```

## 3. Build Common Package

The `@fullmag/common` package needs to be built before running API or Web:

```bash
# From project root
pnpm --filter @fullmag/common build
```

Or keep it building in watch mode (recommended):

```bash
# Terminal 1: Watch common package for changes
pnpm --filter @fullmag/common dev
```

## 4. Start API Server

```bash
# Terminal 2: Start API (NestJS)
pnpm --filter @fullmag/api dev
```

The API will:
- Start on http://localhost:10001
- Connect to postgres on localhost:10050
- Connect to redis on localhost:10100
- Automatically create database tables (synchronize: true)

## 5. Start Web Application

```bash
# Terminal 3: Start Web (Next.js)
PORT=10002 pnpm --filter @fullmag/web dev
```

The web app will be available at http://localhost:10002

## 6. Start Mobile App (React Native)

```bash
# Terminal 4: Start Mobile Metro bundler
pnpm --filter @fullmag/mobile start

# In another terminal, run on iOS or Android:
pnpm --filter @fullmag/mobile ios
# or
pnpm --filter @fullmag/mobile android
```

## Quick Commands

### Restart API
Just Ctrl+C in the API terminal and run again:
```bash
pnpm --filter @fullmag/api dev
```

### Restart Web
Just Ctrl+C in the Web terminal and run again:
```bash
PORT=10002 pnpm --filter @fullmag/web dev
```

### Check Database Tables
```bash
docker exec fullmag-postgres psql -U postgres -d fullmag -c "\dt"
```

### View Logs
API, Web, and Mobile logs will appear directly in their terminal windows.

For infrastructure logs:
```bash
# Postgres logs
docker logs fullmag-postgres

# Redis logs
docker logs fullmag-redis
```

### Reset Database
```bash
# Stop infrastructure
docker-compose -f docker-compose.infra.yml down -v

# Start again (will recreate empty database)
docker-compose -f docker-compose.infra.yml up -d

# Restart API to recreate tables
pnpm --filter @fullmag/api dev
```

## Troubleshooting

### API can't connect to database
Make sure:
- Postgres is running: `docker ps | grep fullmag-postgres`
- Port 10050 is correct in .env: `DB_PORT=10050`
- Database is healthy: `docker exec fullmag-postgres pg_isready -U postgres`

### Web can't reach API
Make sure:
- API is running on port 10001
- .env.local has `NEXT_PUBLIC_API_URL=http://localhost:10001`

### Tables not created
- Wait for API to fully start (check terminal output)
- Look for "Nest application successfully started" message
- Check database: `docker exec fullmag-postgres psql -U postgres -d fullmag -c "\dt"`

## Stop Everything

### Stop applications
Just Ctrl+C in each terminal window (API, Web, Mobile)

### Stop infrastructure
```bash
docker-compose -f docker-compose.infra.yml down
```

### Stop and delete all data
```bash
docker-compose -f docker-compose.infra.yml down -v
```
