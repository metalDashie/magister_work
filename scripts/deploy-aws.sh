#!/bin/bash
set -e

# ========================================
# AWS EC2 Deployment Script for FullMag
# ========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FullMag AWS Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please copy .env.production.example to .env.production and fill in your values"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Function to check if docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Docker not found. Installing...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}Docker installed successfully${NC}"
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}Docker Compose installed successfully${NC}"
    fi
}

# Function to setup directories
setup_directories() {
    echo -e "${YELLOW}Setting up directories...${NC}"
    mkdir -p nginx/ssl
    mkdir -p certbot/conf
    mkdir -p certbot/www
    echo -e "${GREEN}Directories created${NC}"
}

# Function to build and deploy
deploy() {
    echo -e "${YELLOW}Building and deploying services...${NC}"

    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull postgres redis nginx

    # Build application images
    docker-compose -f docker-compose.prod.yml build --no-cache

    # Start services
    docker-compose -f docker-compose.prod.yml up -d

    echo -e "${GREEN}Services deployed successfully${NC}"
}

# Function to check health
check_health() {
    echo -e "${YELLOW}Checking service health...${NC}"
    sleep 10

    services=("api:3001" "web:3000" "whatsapp:3002")

    for service in "${services[@]}"; do
        name="${service%%:*}"
        port="${service##*:}"

        if docker exec fullmag-${name} wget --no-verbose --tries=1 --spider http://localhost:${port}/health 2>/dev/null; then
            echo -e "${GREEN}✓ ${name} is healthy${NC}"
        else
            echo -e "${RED}✗ ${name} health check failed${NC}"
        fi
    done
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    read -p "Enter your domain (e.g., fullmag.com): " DOMAIN
    read -p "Enter your email for SSL certificate: " EMAIL

    echo -e "${YELLOW}Setting up SSL for ${DOMAIN}...${NC}"

    # Stop nginx temporarily
    docker-compose -f docker-compose.prod.yml stop nginx

    # Get certificate
    docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt -v $(pwd)/certbot/www:/var/www/certbot \
        certbot/certbot certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN -d www.$DOMAIN

    # Copy certificates to nginx ssl directory
    cp certbot/conf/live/$DOMAIN/fullchain.pem nginx/ssl/
    cp certbot/conf/live/$DOMAIN/privkey.pem nginx/ssl/

    # Restart nginx
    docker-compose -f docker-compose.prod.yml start nginx

    echo -e "${GREEN}SSL certificate installed for ${DOMAIN}${NC}"
    echo -e "${YELLOW}Remember to uncomment HTTPS section in nginx/nginx.conf${NC}"
}

# Function to view logs
view_logs() {
    docker-compose -f docker-compose.prod.yml logs -f --tail=100
}

# Function to backup database
backup_db() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${YELLOW}Creating database backup: ${BACKUP_FILE}${NC}"
    docker exec fullmag-postgres pg_dump -U postgres fullmag > "backups/${BACKUP_FILE}"
    echo -e "${GREEN}Backup created: backups/${BACKUP_FILE}${NC}"
}

# Function to stop all services
stop() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}All services stopped${NC}"
}

# Function to restart all services
restart() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker-compose -f docker-compose.prod.yml restart
    echo -e "${GREEN}All services restarted${NC}"
}

# Main menu
case "$1" in
    install)
        check_docker
        setup_directories
        ;;
    deploy)
        deploy
        check_health
        ;;
    ssl)
        setup_ssl
        ;;
    logs)
        view_logs
        ;;
    backup)
        mkdir -p backups
        backup_db
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    health)
        check_health
        ;;
    *)
        echo "Usage: $0 {install|deploy|ssl|logs|backup|stop|restart|health}"
        echo ""
        echo "Commands:"
        echo "  install  - Install Docker and setup directories"
        echo "  deploy   - Build and deploy all services"
        echo "  ssl      - Setup SSL certificate with Let's Encrypt"
        echo "  logs     - View logs from all services"
        echo "  backup   - Backup PostgreSQL database"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  health   - Check health of all services"
        exit 1
        ;;
esac
