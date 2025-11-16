#!/bin/bash

# ==============================================================================
# NUNA CURATE - PRE-DEPLOYMENT VALIDATION SCRIPT
# ==============================================================================
# Validates configuration and environment before production deployment
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

# Counters
ERRORS=0
WARNINGS=0
CHECKS_PASSED=0

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=============================================================================="
echo "  NUNA CURATE - PRE-DEPLOYMENT VALIDATION"
echo "=============================================================================="
echo ""

# ==============================================================================
# Check Docker Installation
# ==============================================================================

log_info "Checking Docker installation..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    log_success "Docker installed: $DOCKER_VERSION"
    ((CHECKS_PASSED++))
else
    log_error "Docker is not installed"
    ((ERRORS++))
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    if docker compose version &> /dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version | awk '{print $4}')
    else
        COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
    fi
    log_success "Docker Compose installed: $COMPOSE_VERSION"
    ((CHECKS_PASSED++))
else
    log_error "Docker Compose is not installed"
    ((ERRORS++))
fi

# Check if Docker daemon is running
if docker ps &> /dev/null; then
    log_success "Docker daemon is running"
    ((CHECKS_PASSED++))
else
    log_error "Docker daemon is not running"
    ((ERRORS++))
fi

echo ""

# ==============================================================================
# Check Required Files
# ==============================================================================

log_info "Checking required files..."

REQUIRED_FILES=(
    "docker-compose.prod.yml"
    "apps/web/Dockerfile"
    "apps/backend/Dockerfile"
    "nginx/nginx.conf"
    "nginx/conf.d/default.conf"
    ".dockerignore"
    "apps/web/.dockerignore"
    "apps/backend/.dockerignore"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "Found: $file"
        ((CHECKS_PASSED++))
    else
        log_error "Missing: $file"
        ((ERRORS++))
    fi
done

echo ""

# ==============================================================================
# Check Environment Configuration
# ==============================================================================

log_info "Checking environment configuration..."

if [ -f ".env.production" ]; then
    log_success "Production environment file exists"
    ((CHECKS_PASSED++))

    # Load environment variables
    set -a
    source .env.production
    set +a

    # Check required variables
    REQUIRED_VARS=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SOROBAN_RPC_URL"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -n "${!var}" ]; then
            log_success "Set: $var"
            ((CHECKS_PASSED++))
        else
            log_error "Missing: $var"
            ((ERRORS++))
        fi
    done

    # Check if using default/weak passwords
    if [ "$POSTGRES_PASSWORD" = "CHANGE_THIS_STRONG_PASSWORD_IN_PRODUCTION" ]; then
        log_warning "PostgreSQL password is using default value"
        ((WARNINGS++))
    fi

    if [ "$REDIS_PASSWORD" = "CHANGE_THIS_STRONG_REDIS_PASSWORD" ]; then
        log_warning "Redis password is using default value"
        ((WARNINGS++))
    fi

    if [ "$JWT_SECRET" = "CHANGE_THIS_TO_RANDOM_SECRET_IN_PRODUCTION" ]; then
        log_warning "JWT secret is using default value"
        ((WARNINGS++))
    fi

else
    log_error ".env.production not found"
    log_info "Create it by copying: cp .env.production.example .env.production"
    ((ERRORS++))
fi

echo ""

# ==============================================================================
# Check Network Configuration
# ==============================================================================

log_info "Checking network configuration..."

if [ -n "$STELLAR_NETWORK" ]; then
    if [ "$STELLAR_NETWORK" = "testnet" ] || [ "$STELLAR_NETWORK" = "mainnet" ]; then
        log_success "Stellar network: $STELLAR_NETWORK"
        ((CHECKS_PASSED++))
    else
        log_error "Invalid Stellar network: $STELLAR_NETWORK (must be testnet or mainnet)"
        ((ERRORS++))
    fi
else
    log_warning "STELLAR_NETWORK not set, defaulting to testnet"
    ((WARNINGS++))
fi

# Validate RPC URL
if [ -n "$SOROBAN_RPC_URL" ]; then
    if curl -s --head --request GET "$SOROBAN_RPC_URL/health" | grep "200" > /dev/null; then
        log_success "Soroban RPC URL is reachable"
        ((CHECKS_PASSED++))
    else
        log_warning "Soroban RPC URL may not be reachable: $SOROBAN_RPC_URL"
        ((WARNINGS++))
    fi
fi

echo ""

# ==============================================================================
# Check Disk Space
# ==============================================================================

log_info "Checking disk space..."

AVAILABLE_SPACE=$(df -h . | tail -1 | awk '{print $4}' | sed 's/G//')

if (( $(echo "$AVAILABLE_SPACE > 10" | bc -l) )); then
    log_success "Available disk space: ${AVAILABLE_SPACE}GB"
    ((CHECKS_PASSED++))
elif (( $(echo "$AVAILABLE_SPACE > 5" | bc -l) )); then
    log_warning "Low disk space: ${AVAILABLE_SPACE}GB (recommend >10GB)"
    ((WARNINGS++))
else
    log_error "Insufficient disk space: ${AVAILABLE_SPACE}GB (minimum 5GB required)"
    ((ERRORS++))
fi

echo ""

# ==============================================================================
# Check Port Availability
# ==============================================================================

log_info "Checking port availability..."

PORTS_TO_CHECK=(80 443 5432 6379)

for port in "${PORTS_TO_CHECK[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t &> /dev/null; then
        log_warning "Port $port is already in use"
        ((WARNINGS++))
    else
        log_success "Port $port is available"
        ((CHECKS_PASSED++))
    fi
done

echo ""

# ==============================================================================
# Check Smart Contracts
# ==============================================================================

log_info "Checking smart contract configuration..."

if [ -n "$NFT_CONTRACT_ID" ] && [ "$NFT_CONTRACT_ID" != "" ]; then
    log_success "NFT contract ID is set"
    ((CHECKS_PASSED++))
else
    log_warning "NFT contract ID is not set (deploy contracts first)"
    ((WARNINGS++))
fi

if [ -n "$MARKETPLACE_CONTRACT_ID" ] && [ "$MARKETPLACE_CONTRACT_ID" != "" ]; then
    log_success "Marketplace contract ID is set"
    ((CHECKS_PASSED++))
else
    log_warning "Marketplace contract ID is not set (deploy contracts first)"
    ((WARNINGS++))
fi

echo ""

# ==============================================================================
# Check SSL/TLS Configuration (if HTTPS enabled)
# ==============================================================================

if [ -n "$HTTPS_PORT" ] && [ "$HTTPS_PORT" != "" ]; then
    log_info "Checking SSL/TLS configuration..."

    # Check if SSL is configured in Nginx
    if grep -q "listen 443 ssl" nginx/conf.d/default.conf; then
        log_success "HTTPS is configured in Nginx"
        ((CHECKS_PASSED++))

        # Check for certificate files
        if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
            log_success "SSL certificate files found"
            ((CHECKS_PASSED++))
        else
            log_warning "SSL certificate files not found in nginx/ssl/"
            ((WARNINGS++))
        fi
    else
        log_warning "HTTPS port set but not configured in Nginx"
        ((WARNINGS++))
    fi
    echo ""
fi

# ==============================================================================
# Summary
# ==============================================================================

echo "=============================================================================="
echo "  VALIDATION SUMMARY"
echo "=============================================================================="
echo ""
echo -e "${GREEN}✓${NC} Checks passed:  $CHECKS_PASSED"
echo -e "${YELLOW}⚠${NC} Warnings:       $WARNINGS"
echo -e "${RED}✗${NC} Errors:         $ERRORS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ DEPLOYMENT NOT READY${NC}"
    echo "Please fix the errors above before deploying to production."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ DEPLOYMENT READY WITH WARNINGS${NC}"
    echo "It's recommended to address the warnings, but deployment can proceed."
    echo ""
    read -p "Do you want to continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    exit 0
else
    echo -e "${GREEN}✅ DEPLOYMENT READY${NC}"
    echo "All checks passed! You can proceed with deployment."
    exit 0
fi
