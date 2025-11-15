# Nuna Curate Backend API

Production-ready NestJS backend for the Nuna Curate NFT marketplace on Stellar Soroban.

## Features

- **Authentication**: Wallet-based authentication with JWT tokens
- **NFT Management**: Minting, transfers, metadata management
- **Marketplace**: Listings, offers, auctions, sales
- **Analytics**: Platform statistics, user analytics, trending collections
- **Real-time Updates**: WebSocket support for live marketplace updates
- **Stellar Integration**: Full Soroban smart contract integration
- **Storage**: IPFS (Pinata) and Arweave support
- **Caching**: Redis caching for performance
- **Queue System**: BullMQ for async operations
- **API Documentation**: Swagger/OpenAPI

## Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Queue**: BullMQ
- **Blockchain**: Stellar SDK, Soroban
- **Storage**: IPFS (Pinata), Arweave
- **Documentation**: Swagger

## Prerequisites

- Node.js 20.x+
- PostgreSQL 15+
- Redis 7+
- pnpm 8+

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

See `.env.example` for all required environment variables:

- **Database**: PostgreSQL connection
- **Redis**: Cache and queue configuration
- **JWT**: Authentication secrets
- **Stellar**: Network configuration and contract addresses
- **IPFS**: Pinata API keys
- **Storage**: File upload configuration

## Database Setup

```bash
# Create database
createdb nuna_curate_dev

# Run migrations (when using TypeORM migrations)
pnpm run migration:run

# Or use auto-sync in development (set in .env)
NODE_ENV=development pnpm run dev
```

## Running the Application

```bash
# Development mode with hot-reload
pnpm run dev

# Production mode
pnpm run build
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The API will be available at:
- API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs

## API Endpoints

### Authentication
- `POST /api/v1/auth/challenge` - Get signing challenge
- `POST /api/v1/auth/verify` - Verify signature and get JWT
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/:address` - Get user profile
- `PUT /api/v1/users/me` - Update own profile
- `GET /api/v1/users/:address/nfts` - Get user's NFTs
- `GET /api/v1/users/:address/collections` - Get user's collections

### NFTs
- `GET /api/v1/nfts` - List NFTs (paginated, filtered)
- `GET /api/v1/nfts/:id` - Get NFT details
- `POST /api/v1/nfts` - Mint NFT
- `GET /api/v1/nfts/:id/history` - Get ownership history

### Collections
- `GET /api/v1/collections` - List collections
- `GET /api/v1/collections/:id` - Get collection details
- `POST /api/v1/collections` - Create collection
- `GET /api/v1/collections/:id/nfts` - Get collection's NFTs
- `GET /api/v1/collections/:id/stats` - Get collection statistics

### Marketplace
- `GET /api/v1/marketplace/listings` - List active listings
- `POST /api/v1/marketplace/listings` - Create listing
- `DELETE /api/v1/marketplace/listings/:id` - Cancel listing
- `POST /api/v1/marketplace/listings/:id/buy` - Buy NFT

### Analytics
- `GET /api/v1/analytics/platform` - Platform-wide statistics
- `GET /api/v1/analytics/trending` - Trending collections
- `GET /api/v1/analytics/collections/:id` - Collection analytics

## Architecture

```
apps/backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── stellar.config.ts
│   ├── modules/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── nft/             # NFT operations
│   │   ├── collections/     # Collection management
│   │   ├── marketplace/     # Marketplace operations
│   │   ├── analytics/       # Statistics and analytics
│   │   ├── stellar/         # Stellar/Soroban integration
│   │   ├── storage/         # IPFS/Arweave storage
│   │   └── websocket/       # Real-time updates
│   ├── database/            # Database configuration
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
```

## Database Schema

### Users Table
- Wallet address (unique)
- Profile information (username, bio, avatar)
- Social links
- Verification status

### Collections Table
- Contract address
- Creator reference
- Metadata (name, symbol, description)
- Royalty configuration
- Verification status

### NFTs Table
- Collection and token ID
- Owner and creator references
- Metadata (name, description, image)
- Rarity information

### Listings Table
- NFT reference
- Seller, price, currency
- Status (active, sold, cancelled, expired)
- Expiration date

## Stellar Integration

The backend integrates with Stellar Soroban smart contracts:

### StellarService
- Transaction submission and simulation
- Event monitoring
- Signature verification
- Account management

### ContractService
- Contract method invocation
- Transaction preparation
- NFT operations (mint, transfer)
- Marketplace operations (list, buy)

## Security

- **Wallet Authentication**: Signature-based authentication
- **JWT Tokens**: Short-lived access tokens + refresh tokens
- **Rate Limiting**: Configurable per-endpoint rate limits
- **Input Validation**: Class-validator for all DTOs
- **Helmet**: Security headers
- **CORS**: Configured allowed origins

## Performance

- **Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized indexes on all query columns
- **Pagination**: All list endpoints support pagination
- **Query Optimization**: Relations loaded selectively
- **Compression**: Response compression enabled

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Deployment

### Using Docker

```bash
# Build image
docker build -t nuna-curate-backend .

# Run container
docker run -p 3001:3001 --env-file .env nuna-curate-backend
```

### Environment Setup

1. Set up PostgreSQL database
2. Set up Redis instance
3. Deploy Soroban contracts to testnet/mainnet
4. Update contract addresses in .env
5. Configure IPFS/Arweave credentials
6. Set secure JWT secrets
7. Configure CORS origins

## Monitoring

- Application logs via NestJS logger
- Database query logging (development)
- Redis connection monitoring
- Sentry integration (optional, configure SENTRY_DSN)

## API Documentation

Swagger documentation available at `/api/docs` when running:
- Interactive API explorer
- Request/response schemas
- Authentication testing
- Example requests

## License

[To be determined]

## Support

For issues or questions:
- GitHub Issues
- Discord Community
- Documentation
