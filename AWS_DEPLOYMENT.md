# AWS EC2 Deployment Guide

## Prerequisites

- AWS Account
- Domain name (optional but recommended)
- SSH key pair for EC2

## Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click **Launch Instance**
3. Configure:
   - **Name**: `fullmag-server`
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance type**: `t3.small` (2GB RAM) or `t3.medium` (4GB RAM)
   - **Key pair**: Create or select existing
   - **Security Group**: Create new with rules:
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
   - **Storage**: 30GB gp3

4. Launch and note the **Public IP**

## Step 2: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

## Step 3: Clone Repository

```bash
# Install git
sudo apt update && sudo apt install -y git

# Clone your repo
git clone https://github.com/your-username/fullmag.git
cd fullmag
```

## Step 4: Configure Environment

```bash
# Copy example env file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Important values to set:**
- `POSTGRES_PASSWORD` - Strong password
- `JWT_SECRET` - Random 32+ char string
- `SERVICE_API_KEY` - Random API key
- `NEXT_PUBLIC_API_URL` - `http://YOUR_EC2_IP/api` (or your domain)
- WhatsApp credentials if using

## Step 5: Deploy

```bash
# Make script executable
chmod +x scripts/deploy-aws.sh

# Install Docker
./scripts/deploy-aws.sh install

# Re-login for docker group (or use sudo)
exit
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd fullmag

# Deploy
./scripts/deploy-aws.sh deploy
```

## Step 6: Verify

```bash
# Check health
./scripts/deploy-aws.sh health

# View logs
./scripts/deploy-aws.sh logs
```

Visit `http://YOUR_EC2_IP` to see your app!

---

## Setting Up Domain & SSL

### 1. Point Domain to EC2

In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):
- Add **A Record**: `@` → `YOUR_EC2_IP`
- Add **A Record**: `www` → `YOUR_EC2_IP`

Wait 5-10 minutes for DNS propagation.

### 2. Update Environment

```bash
nano .env.production

# Update these:
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com
STORE_URL=https://your-domain.com
```

### 3. Get SSL Certificate

```bash
./scripts/deploy-aws.sh ssl
# Enter your domain and email when prompted
```

### 4. Enable HTTPS in Nginx

```bash
nano nginx/nginx.conf
# Uncomment the HTTPS server block
# Update server_name with your domain

# Restart
./scripts/deploy-aws.sh restart
```

---

## WhatsApp Webhook Setup

After deployment, configure your webhook in Meta Developer Console:

1. Go to [Meta Developer Console](https://developers.facebook.com/)
2. Select your app → WhatsApp → Configuration
3. Set Webhook URL: `https://your-domain.com/whatsapp/webhook`
4. Set Verify Token: Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env.production`
5. Subscribe to `messages` field

---

## Useful Commands

```bash
# View logs
./scripts/deploy-aws.sh logs

# Restart services
./scripts/deploy-aws.sh restart

# Stop all
./scripts/deploy-aws.sh stop

# Backup database
./scripts/deploy-aws.sh backup

# Check health
./scripts/deploy-aws.sh health

# Manual docker commands
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs api
docker exec -it fullmag-postgres psql -U postgres -d fullmag
```

---

## Estimated Costs

| Resource | Monthly Cost |
|----------|-------------|
| t3.small EC2 (2GB) | ~$15 |
| 30GB EBS storage | ~$2.50 |
| Data transfer (50GB) | ~$4.50 |
| **Total** | **~$22/month** |

For lower costs:
- Use `t3.micro` (1GB) for ~$8/month (tight but works)
- Use Reserved Instance for 30-40% savings
- Use Spot Instance for dev/test

---

## Scaling Up

When you need more performance:

1. **Vertical**: Upgrade to `t3.medium` or `t3.large`
2. **Database**: Move PostgreSQL to RDS (~$15/month)
3. **CDN**: Add CloudFront for static assets
4. **Load Balancer**: Add ALB for multiple instances

---

## Troubleshooting

### Services not starting
```bash
docker-compose -f docker-compose.prod.yml logs
```

### Database connection issues
```bash
docker exec -it fullmag-postgres psql -U postgres -d fullmag
```

### Out of memory
```bash
# Check memory
free -h

# Add swap (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Port 80 already in use
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # if apache is running
```
