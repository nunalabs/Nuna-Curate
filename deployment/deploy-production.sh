#!/bin/bash

# ==============================================================================
# NUNA CURATE - PRODUCTION DEPLOYMENT SCRIPT
# ==============================================================================
# Deploys the full-stack application to production using Docker Compose
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

log_info "Running pre-flight checks..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine Docker Compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log_success "Docker and Docker Compose are installed"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found!"
    log_info "Please copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

log_success "Environment configuration found"

# Load environment variables
set -a
source .env.production
set +a

# Validate required environment variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "SOROBAN_RPC_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required environment variable $var is not set"
        exit 1
    fi
done

log_success "All required environment variables are set"

# ==============================================================================
# Deployment Options
# ==============================================================================

log_info "Deployment Options:"
echo "1. Fresh deployment (build images and start)"
echo "2. Update deployment (rebuild and restart)"
echo "3. Restart services (no rebuild)"
echo "4. Stop services"
echo "5. View logs"
echo "6. Database backup"
echo "7. Exit"
echo ""

read -p "Select an option (1-7): " DEPLOY_OPTION

case $DEPLOY_OPTION in
    1)
        log_info "Starting fresh deployment..."

        # Stop and remove existing containers
        log_info "Stopping existing containers..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml down -v

        # Build images
        log_info "Building Docker images..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache

        # Start services
        log_info "Starting services..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml up -d

        log_success "Deployment completed!"
        ;;

    2)
        log_info "Updating deployment..."

        # Pull latest code (if using git)
        if [ -d ".git" ]; then
            log_info "Pulling latest code..."
            git pull
        fi

        # Rebuild images
        log_info "Rebuilding Docker images..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml build

        # Restart services
        log_info "Restarting services..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml up -d

        log_success "Update completed!"
        ;;

    3)
        log_info "Restarting services..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml restart
        log_success "Services restarted!"
        ;;

    4)
        log_info "Stopping services..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml down
        log_success "Services stopped!"
        ;;

    5)
        log_info "Viewing logs (Ctrl+C to exit)..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f
        ;;

    6)
        log_info "Creating database backup..."

        # Create backup directory
        BACKUP_DIR="$PROJECT_ROOT/backups"
        mkdir -p "$BACKUP_DIR"

        # Generate backup filename with timestamp
        BACKUP_FILE="$BACKUP_DIR/nuna_curate_$(date +%Y%m%d_%H%M%S).sql"

        # Create backup
        docker exec nuna-postgres-prod pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

        log_success "Database backup created: $BACKUP_FILE"
        ;;

    7)
        log_info "Exiting..."
        exit 0
        ;;

    *)
        log_error "Invalid option"
        exit 1
        ;;
esac

# ==============================================================================
# Post-deployment Health Checks
# ==============================================================================

if [ "$DEPLOY_OPTION" == "1" ] || [ "$DEPLOY_OPTION" == "2" ] || [ "$DEPLOY_OPTION" == "3" ]; then
    log_info "Running health checks..."

    # Wait for services to be healthy
    sleep 10

    # Check PostgreSQL
    if docker exec nuna-postgres-prod pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        log_success "PostgreSQL is healthy"
    else
        log_error "PostgreSQL is not healthy"
    fi

    # Check Redis
    if docker exec nuna-redis-prod redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        log_success "Redis is healthy"
    else
        log_error "Redis is not healthy"
    fi

    # Check Backend
    if docker exec nuna-backend-prod wget -q --spider http://localhost:4000/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_error "Backend is not healthy"
    fi

    # Check Frontend
    if docker exec nuna-frontend-prod wget -q --spider http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend is not healthy"
    fi

    # Check Nginx
    if docker exec nuna-nginx-prod wget -q --spider http://localhost/health > /dev/null 2>&1; then
        log_success "Nginx is healthy"
    else
        log_error "Nginx is not healthy"
    fi

    echo ""
    log_success "Deployment health check completed!"
    echo ""
    log_info "Services:"
    log_info "  - Frontend: http://localhost (or your domain)"
    log_info "  - Backend API: http://localhost/api"
    log_info "  - PostgreSQL: localhost:5432"
    log_info "  - Redis: localhost:6379"
    echo ""
    log_info "View logs with: $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
    log_info "Stop services with: $DOCKER_COMPOSE -f docker-compose.prod.yml down"
fi
