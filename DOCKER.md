# 🐳 NUNA CURATE - DOCKER DEPLOYMENT GUIDE

**Production-ready Docker configuration for Nuna Curate NFT Marketplace**

---

## 📋 OVERVIEW

This guide covers Docker-based deployment for both **development** and **production** environments.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)             │
│                 Port 80/443                         │
└────────────┬────────────────────────┬───────────────┘
             │                        │
    ┌────────▼────────┐      ┌───────▼────────┐
    │   Frontend      │      │    Backend     │
    │   (Next.js)     │      │   (NestJS)     │
    │   Port 3000     │      │   Port 4000    │
    └────────┬────────┘      └───────┬────────┘
             │                        │
             └────────┬───────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
    │PostgreSQL│  │ Redis  │  │ Nginx  │
    │ Port 5432│  │Port 6379│ │  Logs  │
    └──────────┘  └────────┘  └────────┘
```

---

## 🚀 QUICK START

### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production

# Deploy
./deployment/deploy-production.sh
```

---

## 📦 CONTAINER IMAGES

### Frontend (Next.js)
- **Base Image**: `node:20-alpine`
- **Size**: ~200MB (optimized)
- **Build Type**: Multi-stage
- **Port**: 3000

### Backend (NestJS)
- **Base Image**: `node:20-alpine`
- **Size**: ~150MB (optimized)
- **Build Type**: Multi-stage
- **Port**: 4000

### Database (PostgreSQL)
- **Image**: `postgres:16-alpine`
- **Size**: ~250MB
- **Port**: 5432

### Cache (Redis)
- **Image**: `redis:7-alpine`
- **Size**: ~30MB
- **Port**: 6379

### Reverse Proxy (Nginx)
- **Image**: `nginx:alpine`
- **Size**: ~40MB
- **Ports**: 80, 443

---

## 🔧 CONFIGURATION

### Environment Variables

#### Required (Production)

```bash
# Database
POSTGRES_PASSWORD=<strong-password>

# Redis
REDIS_PASSWORD=<strong-password>

# Security
JWT_SECRET=<random-secret>

# Stellar/Soroban
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NFT_CONTRACT_ID=<your-nft-contract-id>
MARKETPLACE_CONTRACT_ID=<your-marketplace-contract-id>
```

#### Optional

```bash
# CORS
CORS_ORIGIN=https://your-domain.com

# File Uploads
MAX_FILE_SIZE=10485760  # 10MB

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# IPFS
IPFS_GATEWAY=https://ipfs.io
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_KEY=<your-pinata-secret>
```

### Docker Compose Files

- **`docker-compose.yml`**: Development environment
- **`docker-compose.prod.yml`**: Production environment

---

## 🏗️ BUILD PROCESS

### Multi-Stage Build Strategy

All Dockerfiles use multi-stage builds to minimize image size:

1. **Dependencies Stage**: Install all dependencies
2. **Builder Stage**: Compile TypeScript → JavaScript
3. **Production Dependencies Stage**: Install only runtime deps
4. **Runner Stage**: Minimal runtime with compiled code only

### Build Commands

```bash
# Build frontend only
docker build -f apps/web/Dockerfile -t nuna-frontend .

# Build backend only
docker build -f apps/backend/Dockerfile -t nuna-backend .

# Build using monorepo Dockerfile
docker build --build-arg APP_NAME=web -t nuna-web .
docker build --build-arg APP_NAME=backend -t nuna-backend .

# Build all services (production)
docker-compose -f docker-compose.prod.yml build
```

---

## 🔐 SECURITY

### Best Practices Implemented

- ✅ **Non-root users**: All containers run as non-root
- ✅ **Minimal base images**: Alpine Linux for small attack surface
- ✅ **Health checks**: All services have health endpoints
- ✅ **Secrets management**: Environment-based configuration
- ✅ **Network isolation**: Services communicate via Docker network
- ✅ **Rate limiting**: Nginx-level request throttling
- ✅ **HTTPS ready**: SSL/TLS configuration included (commented)

### Secrets

**NEVER** commit these to Git:

```
.env.production
.env.local
ssl/
```

Generate strong secrets:

```bash
# JWT Secret (32 bytes)
openssl rand -base64 32

# PostgreSQL Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

---

## 📊 MONITORING

### Health Checks

All services expose health check endpoints:

```bash
# Frontend
curl http://localhost:3000/api/health

# Backend
curl http://localhost:4000/health

# PostgreSQL
docker exec nuna-postgres-prod pg_isready -U nuna_user

# Redis
docker exec nuna-redis-prod redis-cli -a <password> ping

# Nginx
curl http://localhost/health
```

### Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Nginx access logs
docker exec nuna-nginx-prod tail -f /var/log/nginx/access.log
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 💾 BACKUPS

### Database Backup

```bash
# Manual backup
docker exec nuna-postgres-prod pg_dump -U nuna_user nuna_curate > backup.sql

# Automated backup script
./deployment/deploy-production.sh
# Select option 6 (Database backup)
```

### Restore from Backup

```bash
# Restore database
docker exec -i nuna-postgres-prod psql -U nuna_user nuna_curate < backup.sql
```

### Volume Backups

```bash
# Backup named volumes
docker run --rm -v nuna-curate_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v nuna-curate_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
docker run --rm -v nuna-curate_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_data.tar.gz -C /data .
```

---

## 🔄 UPDATES & MAINTENANCE

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Zero-Downtime Updates

```bash
# Scale backend to 2 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# Update one instance at a time
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend

# Scale back to 1
docker-compose -f docker-compose.prod.yml up -d --scale backend=1
```

### Database Migrations

```bash
# Run migrations
docker exec nuna-backend-prod pnpm run migration:run

# Revert migration
docker exec nuna-backend-prod pnpm run migration:revert
```

---

## 🐛 TROUBLESHOOTING

### Common Issues

#### Container won't start

```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker ps -a

# Inspect container
docker inspect <container-name>
```

#### Out of memory

```bash
# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory → 4GB+

# Check memory usage
docker stats
```

#### Port already in use

```bash
# Find process using port
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

#### Database connection failed

```bash
# Check if PostgreSQL is running
docker exec nuna-postgres-prod pg_isready -U nuna_user

# Check connection from backend
docker exec nuna-backend-prod ping postgres

# Verify environment variables
docker exec nuna-backend-prod env | grep DATABASE
```

#### Frontend can't reach backend

```bash
# Check if backend is healthy
curl http://localhost/api/health

# Check Nginx configuration
docker exec nuna-nginx-prod nginx -t

# Check Nginx logs
docker exec nuna-nginx-prod cat /var/log/nginx/error.log
```

### Clean Up

```bash
# Remove all containers and volumes
docker-compose -f docker-compose.prod.yml down -v

# Remove unused images
docker image prune -a

# Remove everything (BE CAREFUL!)
docker system prune -a --volumes
```

---

## 📈 PERFORMANCE OPTIMIZATION

### PostgreSQL Tuning

Already configured in `docker-compose.prod.yml`:

- **shared_buffers**: 512MB
- **effective_cache_size**: 2GB
- **work_mem**: 8MB
- **max_connections**: 200

### Redis Tuning

- **maxmemory**: 512MB
- **maxmemory-policy**: allkeys-lru
- **appendonly**: yes (persistence enabled)

### Nginx Caching

- **Static assets**: Cached for 30 days
- **Images**: Cached for 7 days
- **API responses**: Not cached (dynamic)

### Image Optimization

Our multi-stage builds reduce image sizes:

- **Before optimization**: ~1.5GB per service
- **After optimization**: ~150-200MB per service
- **Total savings**: ~85%

---

## 🌐 PRODUCTION DEPLOYMENT

### Prerequisites

- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- Server with Docker installed (min 2GB RAM, 2 CPU cores)

### Steps

1. **Configure DNS**:
   ```
   A record: your-domain.com → server IP
   A record: www.your-domain.com → server IP
   ```

2. **Generate SSL Certificate**:
   ```bash
   # Using Certbot
   certbot certonly --standalone -d your-domain.com -d www.your-domain.com
   ```

3. **Configure Environment**:
   ```bash
   cp .env.production.example .env.production
   # Edit with production values
   ```

4. **Update Nginx Config**:
   - Uncomment HTTPS server block in `nginx/conf.d/default.conf`
   - Update `server_name` with your domain
   - Point to SSL certificate files

5. **Deploy**:
   ```bash
   ./deployment/deploy-production.sh
   # Select option 1 (Fresh deployment)
   ```

6. **Verify**:
   ```bash
   curl https://your-domain.com
   curl https://your-domain.com/api/health
   ```

---

## 📚 ADDITIONAL RESOURCES

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [NestJS Docker Guide](https://docs.nestjs.com/faq/serverless)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## 🛠️ MAINTENANCE CHECKLIST

### Daily

- [ ] Monitor health check endpoints
- [ ] Review error logs
- [ ] Check disk space

### Weekly

- [ ] Review application logs
- [ ] Check database performance
- [ ] Monitor resource usage

### Monthly

- [ ] Update Docker images
- [ ] Backup database
- [ ] Review and rotate logs
- [ ] Update SSL certificates (if needed)

### Quarterly

- [ ] Security audit
- [ ] Performance optimization review
- [ ] Dependency updates

---

**Maintained by**: Nuna Labs
**Last Updated**: November 2024
**Status**: Production Ready ✅
