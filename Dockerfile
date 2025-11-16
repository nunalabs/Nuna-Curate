# ==============================================================================
# NUNA CURATE - MONOREPO DOCKERFILE (PRODUCTION)
# ==============================================================================
# Multi-stage build for full-stack application
# This Dockerfile can build both frontend and backend from the monorepo
# Use build arguments to specify which app to build
# ==============================================================================

ARG APP_NAME=web

# ------------------------------------------------------------------------------
# Stage 1: Base Dependencies
# Install base dependencies for the monorepo
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all package.json files for dependency resolution
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/wallet/package.json ./packages/wallet/

# ------------------------------------------------------------------------------
# Stage 2: Dependencies
# Install all dependencies (including dev dependencies)
# ------------------------------------------------------------------------------
FROM base AS deps

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 3: Builder
# Build the specified application
# ------------------------------------------------------------------------------
FROM base AS builder

ARG APP_NAME

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application using Turborepo
RUN pnpm turbo build --filter=${APP_NAME}

# ------------------------------------------------------------------------------
# Stage 4: Production Dependencies
# Install only production dependencies
# ------------------------------------------------------------------------------
FROM base AS prod-deps

ARG APP_NAME

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile --filter=${APP_NAME}

# ------------------------------------------------------------------------------
# Stage 5: Web Runner (Next.js)
# Production runtime for Next.js application
# ------------------------------------------------------------------------------
FROM node:20-alpine AS web-runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/web/server.js"]

# ------------------------------------------------------------------------------
# Stage 6: Backend Runner (NestJS)
# Production runtime for NestJS application
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-runner

# Install pnpm and dumb-init
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy production dependencies
COPY --from=prod-deps --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nestjs /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nestjs /app/apps/backend/database ./apps/backend/database

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nestjs:nestjs /app/uploads

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/backend/dist/main.js"]

# ------------------------------------------------------------------------------
# Final Stage: Select runner based on APP_NAME
# ------------------------------------------------------------------------------
FROM ${APP_NAME}-runner AS final
