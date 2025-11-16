# FullMag Testing Guide

This guide will help you test your entire e-commerce setup from scratch.

## Prerequisites

Make sure Docker Desktop is running on your Windows machine.

## 1. Start All Services

```bash
# Navigate to project directory
cd C:\Users\Iurii\Desktop\magister\fullmag

# Start all services with docker-compose
docker-compose -f docker-compose.dev.yml up -d

# Check all containers are running
docker-compose -f docker-compose.dev.yml ps
```

Expected output: All containers should show "Up" or "healthy" status.

## 2. Verify Database Tables

Check that TypeORM automatically created all tables:

```bash
docker exec fullmag-postgres psql -U postgres -d fullmag -c "\dt"
```

Expected: You should see 12 tables:
- cart_items
- carts
- categories
- chat_messages
- chat_rooms
- delivery_addresses
- notifications
- order_items
- orders
- payments
- products
- users

## 3. Test API Endpoints

### Check API Health
Open your browser or use curl:
```bash
curl http://localhost:10001/api
```

### Test Authentication Endpoints

#### Register a new user
```bash
curl -X POST http://localhost:10001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
```

#### Login
```bash
curl -X POST http://localhost:10001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Save the `access_token` from the response for authenticated requests.

### Test Product Endpoints

#### Get all products
```bash
curl http://localhost:10001/api/products
```

#### Get all categories
```bash
curl http://localhost:10001/api/categories
```

### Test Cart Endpoints (requires authentication)

```bash
# Replace YOUR_TOKEN with the token from login
curl http://localhost:10001/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Test Web Application

Open your browser and navigate to:
```
http://localhost:10002
```

You should see the Next.js web application. Test the following:

1. **Homepage** - Should load without errors
2. **Products Page** - Navigate to `/products`
3. **Categories** - Navigate to `/categories`
4. **Login** - Navigate to `/auth/login`
5. **Register** - Navigate to `/auth/register`

## 5. Verify Database Connectivity

### Check if you can query the database
```bash
docker exec fullmag-postgres psql -U postgres -d fullmag -c "SELECT COUNT(*) FROM users;"
```

### Check Redis connectivity
```bash
docker exec fullmag-redis redis-cli ping
```

Expected: `PONG`

## 6. Monitor Service Logs

### View API logs
```bash
docker logs fullmag-api --tail 50 -f
```

### View Web logs
```bash
docker logs fullmag-web --tail 50 -f
```

### View Database logs
```bash
docker logs fullmag-postgres --tail 50
```

## 7. Test Database CRUD Operations

### Insert test data
```bash
docker exec fullmag-postgres psql -U postgres -d fullmag -c "
INSERT INTO users (id, email, \"passwordHash\", \"firstName\", \"lastName\", role, \"createdAt\", \"updatedAt\")
VALUES (gen_random_uuid(), 'admin@fullmag.com', '\$2a\$10\$YourHashedPassword', 'Admin', 'User', 'ADMIN', NOW(), NOW())
ON CONFLICT DO NOTHING;
"
```

### Query data
```bash
docker exec fullmag-postgres psql -U postgres -d fullmag -c "SELECT email, \"firstName\", \"lastName\", role FROM users;"
```

## 8. Test GraphQL Playground (if enabled)

Navigate to:
```
http://localhost:10001/graphql
```

Try a sample query:
```graphql
query {
  users {
    email
    firstName
    lastName
  }
}
```

## 9. Common Issues & Solutions

### API not starting
```bash
# Check API logs for errors
docker logs fullmag-api

# Restart the API
docker-compose -f docker-compose.dev.yml restart api
```

### Database connection issues
```bash
# Check if PostgreSQL is healthy
docker exec fullmag-postgres pg_isready -U postgres

# Check database logs
docker logs fullmag-postgres
```

### Port already in use
```bash
# Check what's using the port (e.g., 10001)
netstat -ano | findstr :10001

# Stop the service using that port or change ports in docker-compose.dev.yml
```

## 10. Stop All Services

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose -f docker-compose.dev.yml down -v
```

## 11. Complete Fresh Start

To test everything from scratch:

```bash
# 1. Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v

# 2. Remove node_modules (optional, if you had permission issues)
# On Windows, you might need to use File Explorer or:
# Remove-Item -Recurse -Force node_modules

# 3. Start fresh
docker-compose -f docker-compose.dev.yml up -d

# 4. Wait 30-60 seconds for initialization

# 5. Check logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Testing Checklist

- [ ] All 4 containers running (postgres, redis, api, web)
- [ ] Database has 12 tables created
- [ ] API responds at http://localhost:10001/api
- [ ] Can register a new user
- [ ] Can login and get JWT token
- [ ] Can fetch products list
- [ ] Web app loads at http://localhost:10002
- [ ] Can navigate between pages on web app
- [ ] Redis responds to PING
- [ ] Can query database directly

## Quick Health Check Script

```bash
echo "=== Container Status ==="
docker-compose -f docker-compose.dev.yml ps

echo "\n=== Database Tables ==="
docker exec fullmag-postgres psql -U postgres -d fullmag -c "\dt"

echo "\n=== Redis Status ==="
docker exec fullmag-redis redis-cli ping

echo "\n=== API Health ==="
curl -s http://localhost:10001/api || echo "API not responding"

echo "\n=== Web App Health ==="
curl -s http://localhost:10002 | grep -q "html" && echo "Web app is running" || echo "Web app not responding"
```

Save this as `test.sh` and run it to quickly check all services.
