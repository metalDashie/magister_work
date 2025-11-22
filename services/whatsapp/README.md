# WhatsApp Bot Service

Standalone WhatsApp Cloud API service for FullMag store.

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your WhatsApp Cloud API credentials from [Meta Developer Console](https://developers.facebook.com/).

### 2. Run Locally

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

### 3. Deploy with Docker

```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t fullmag-whatsapp .
docker run -p 3002:3002 --env-file .env fullmag-whatsapp
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3002) | No |
| `WHATSAPP_BOT_ENABLED` | Enable/disable bot | Yes |
| `WHATSAPP_ACCESS_TOKEN` | Meta API access token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | Your WhatsApp phone number ID | Yes |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Custom token for webhook verification | Yes |
| `SERVICE_API_KEY` | API key for protected endpoints | Yes |
| `MAIN_API_URL` | Main API URL for event notifications | No |
| `STORE_URL` | Store URL for bot messages | No |

## WhatsApp Setup

1. Create a Meta Developer account
2. Create a WhatsApp Business app
3. Add a phone number (or use test number)
4. Get your Access Token and Phone Number ID
5. Configure webhook URL: `https://your-domain.com/whatsapp/webhook`
6. Set your verify token (same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
7. Subscribe to `messages` webhook field

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | Service info | - |
| GET | `/health` | Health check | - |
| GET | `/whatsapp/webhook` | Webhook verification | - |
| POST | `/whatsapp/webhook` | Incoming messages | - |
| GET | `/whatsapp/status` | Bot status | - |
| POST | `/whatsapp/send` | Send message | API Key |
| POST | `/whatsapp/broadcast` | Broadcast message | API Key |

## Sending Messages from Main API

```typescript
// From your main API service
await axios.post('https://whatsapp-service.com/whatsapp/send', {
  to: '380501234567',
  message: 'Your order has been shipped!'
}, {
  headers: {
    'x-api-key': process.env.WHATSAPP_SERVICE_API_KEY
  }
})
```

## Hosting Options

- **Railway** - Easy deployment with GitHub integration
- **Render** - Free tier available
- **Fly.io** - Global edge deployment
- **DigitalOcean App Platform** - Simple Docker deployment
- **Any VPS** - Use Docker or PM2

## Webhook URL for Meta

After deployment, your webhook URL will be:
```
https://your-domain.com/whatsapp/webhook
```
