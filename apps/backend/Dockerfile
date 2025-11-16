# ==============================================================================
# NUNA CURATE - BACKEND DOCKERFILE (PRODUCTION)
# ==============================================================================
# Multi-stage build for NestJS application
# Optimized for production deployment with minimal image size
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies (including dev dependencies for build)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Builder
# Build the NestJS application
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production

# Build the application
# This will compile TypeScript to JavaScript
RUN pnpm --filter backend build

# ------------------------------------------------------------------------------
# Stage 3: Production Dependencies
# Install only production dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS prod-deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/config/package.json ./packages/config/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 4: Runner
# Production runtime with minimal dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

# Copy production dependencies
COPY --from=prod-deps --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nestjs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=prod-deps --chown=nestjs:nestjs /app/packages/config/node_modules ./packages/config/node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/dist ./apps/backend/dist

# Copy package files
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/package.json ./apps/backend/package.json

# Copy database migrations and schema
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/database ./apps/backend/database

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chown -R nestjs:nestjs /app/uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/backend/dist/main.js"]
