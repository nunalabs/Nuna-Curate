# Nuna Curate: Technical Architecture Specification

**Version:** 1.0
**Date:** November 15, 2024
**Status:** Recommendation / Planning Phase

---

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Smart Contract Architecture](#smart-contract-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow & Integration](#data-flow--integration)
6. [Infrastructure & DevOps](#infrastructure--devops)
7. [Security Architecture](#security-architecture)
8. [Scalability Plan](#scalability-plan)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Mobile App (Future)  │  Admin Dashboard  │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ HTTPS/WSS
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  API Gateway │  │   WebSocket  │  │   CDN Edge   │         │
│  │  (REST/GQL)  │  │    Server    │  │   (Static)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘         │
│         │                  │                                     │
│  ┌──────▼──────────────────▼─────────────────────┐             │
│  │         Microservices Layer                    │             │
│  ├────────────────────────────────────────────────┤             │
│  │ User Service │ NFT Service │ Marketplace Svc  │             │
│  │ Auth Service │ Search Svc  │ Analytics Svc    │             │
│  │ Notification │ Image Proc  │ Indexer Service  │             │
│  └──────┬───────────────┬─────────────┬───────────┘             │
└─────────┼───────────────┼─────────────┼─────────────────────────┘
          │               │             │
┌─────────▼───────────────▼─────────────▼─────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis    │  Elasticsearch  │  Message Queue     │
│  (Primary)   │  (Cache)  │  (Search)       │  (BullMQ)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Stellar    │  │   SubQuery   │  │  Stellar RPC │         │
│  │   Network    │◄─┤   Indexer    │◄─┤   Monitor    │         │
│  └──────┬───────┘  └──────────────┘  └──────────────┘         │
│         │                                                        │
│  ┌──────▼───────────────────────────────────────┐              │
│  │        Soroban Smart Contracts                │              │
│  ├───────────────────────────────────────────────┤              │
│  │ NFT Contract │ Marketplace │ Royalty Manager │              │
│  │ Collection   │ Auction     │ Access Control  │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Arweave (Permanent) │ IPFS (Flexible) │ S3 (Temp/Backups)     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, TypeScript, Tailwind | Web application |
| **Backend** | Node.js, NestJS, TypeScript | API services |
| **Smart Contracts** | Rust, Soroban SDK | Blockchain logic |
| **Database** | PostgreSQL 15+ | Primary data store |
| **Cache** | Redis 7+ | Performance, sessions |
| **Search** | Meilisearch | NFT search/discovery |
| **Queue** | BullMQ | Async processing |
| **Indexer** | SubQuery | Blockchain data |
| **Storage** | Arweave, IPFS, S3 | Media files |
| **CDN** | CloudFlare | Global delivery |
| **Monitoring** | Sentry, DataDog | Observability |

---

## 2. Smart Contract Architecture

### 2.1 Contract Modules

#### Core Contracts

**1. NFT Contract (ERC-721 equivalent)**
```rust
// Simplified interface
pub trait NFTContract {
    // Minting
    fn mint(env: Env, to: Address, token_id: u64, metadata_uri: String) -> Result<(), Error>;

    // Transfer
    fn transfer(env: Env, from: Address, to: Address, token_id: u64) -> Result<(), Error>;
    fn transfer_from(env: Env, from: Address, to: Address, token_id: u64) -> Result<(), Error>;

    // Approval
    fn approve(env: Env, to: Address, token_id: u64) -> Result<(), Error>;
    fn set_approval_for_all(env: Env, operator: Address, approved: bool) -> Result<(), Error>;

    // Metadata
    fn token_uri(env: Env, token_id: u64) -> String;
    fn owner_of(env: Env, token_id: u64) -> Address;
    fn balance_of(env: Env, owner: Address) -> u64;

    // Collection info
    fn name(env: Env) -> String;
    fn symbol(env: Env) -> String;
}
```

**2. Marketplace Contract**
```rust
pub trait MarketplaceContract {
    // Listings
    fn create_listing(env: Env, nft: Address, token_id: u64, price: i128, expiry: u64) -> Result<u64, Error>;
    fn cancel_listing(env: Env, listing_id: u64) -> Result<(), Error>;
    fn update_listing(env: Env, listing_id: u64, new_price: i128) -> Result<(), Error>;

    // Purchases
    fn buy(env: Env, listing_id: u64) -> Result<(), Error>;

    // Offers
    fn make_offer(env: Env, nft: Address, token_id: u64, price: i128, expiry: u64) -> Result<u64, Error>;
    fn accept_offer(env: Env, offer_id: u64) -> Result<(), Error>;
    fn cancel_offer(env: Env, offer_id: u64) -> Result<(), Error>;

    // Admin
    fn set_platform_fee(env: Env, fee_bps: u32) -> Result<(), Error>;
    fn withdraw_fees(env: Env) -> Result<(), Error>;
}
```

**3. Auction Contract**
```rust
pub trait AuctionContract {
    // Auction creation
    fn create_auction(
        env: Env,
        nft: Address,
        token_id: u64,
        starting_price: i128,
        reserve_price: i128,
        start_time: u64,
        end_time: u64,
        auction_type: AuctionType
    ) -> Result<u64, Error>;

    // Bidding
    fn place_bid(env: Env, auction_id: u64, amount: i128) -> Result<(), Error>;
    fn place_sealed_bid(env: Env, auction_id: u64, commitment: BytesN<32>) -> Result<(), Error>;
    fn reveal_bid(env: Env, auction_id: u64, amount: i128, salt: BytesN<32>) -> Result<(), Error>;

    // Finalization
    fn finalize_auction(env: Env, auction_id: u64) -> Result<(), Error>;
    fn cancel_auction(env: Env, auction_id: u64) -> Result<(), Error>;

    // Extensions
    fn extend_auction(env: Env, auction_id: u64) -> Result<(), Error>;
}
```

**4. Royalty Manager**
```rust
pub trait RoyaltyManager {
    // Based on OpenZeppelin implementation
    fn set_default_royalty(env: Env, receiver: Address, fee_bps: u32) -> Result<(), Error>;
    fn set_token_royalty(env: Env, token_id: u64, receiver: Address, fee_bps: u32) -> Result<(), Error>;
    fn royalty_info(env: Env, token_id: u64, sale_price: i128) -> (Address, i128);
    fn delete_default_royalty(env: Env) -> Result<(), Error>;
}
```

**5. Collection Factory**
```rust
pub trait CollectionFactory {
    fn create_collection(
        env: Env,
        name: String,
        symbol: String,
        base_uri: String,
        royalty_receiver: Address,
        royalty_bps: u32
    ) -> Result<Address, Error>;

    fn get_collections(env: Env, creator: Address) -> Vec<Address>;
}
```

### 2.2 Contract Deployment Strategy

**Development:**
- Local: Soroban sandbox for rapid iteration
- Testnet: Stellar testnet for integration testing
- Staging: Testnet with production-like data

**Mainnet Deployment:**
1. Comprehensive audit (use Soroban Security Audit Bank)
2. Bug bounty program (2-4 weeks)
3. Gradual rollout:
   - Phase 1: Whitelisted creators only
   - Phase 2: Limited public access
   - Phase 3: Full public launch
4. Contract upgrade plan (if needed)

### 2.3 Events & Logging

**Critical Events to Emit:**
```rust
// NFT Events
event Transfer { from: Address, to: Address, token_id: u64 }
event Approval { owner: Address, approved: Address, token_id: u64 }
event Mint { to: Address, token_id: u64, metadata_uri: String }
event Burn { from: Address, token_id: u64 }

// Marketplace Events
event ListingCreated { listing_id: u64, seller: Address, nft: Address, token_id: u64, price: i128 }
event ListingCancelled { listing_id: u64 }
event Sale { listing_id: u64, seller: Address, buyer: Address, price: i128 }
event OfferMade { offer_id: u64, buyer: Address, nft: Address, token_id: u64, price: i128 }
event OfferAccepted { offer_id: u64, seller: Address, buyer: Address, price: i128 }

// Auction Events
event AuctionCreated { auction_id: u64, seller: Address, nft: Address, token_id: u64 }
event BidPlaced { auction_id: u64, bidder: Address, amount: i128 }
event AuctionFinalized { auction_id: u64, winner: Address, final_price: i128 }

// Royalty Events
event RoyaltyPaid { token_id: u64, recipient: Address, amount: i128 }
```

---

## 3. Backend Architecture

### 3.1 Microservices Design

#### Service Breakdown

**1. User Service**
- Authentication (JWT-based)
- User profiles (username, bio, avatar)
- Wallet management
- Settings and preferences
- Email verification

**2. NFT Service**
- Metadata management
- Image/media processing queue
- Collection management
- Trait/rarity calculation
- Metadata validation

**3. Marketplace Service**
- Listing management
- Offer handling
- Auction coordination
- Price history tracking
- Sales analytics

**4. Search Service**
- Meilisearch integration
- Index management
- Search queries
- Filters and facets
- Autocomplete

**5. Analytics Service**
- User activity tracking
- Sales metrics
- Creator earnings
- Platform statistics
- Trend analysis

**6. Notification Service**
- Email notifications (SendGrid/Mailgun)
- Push notifications (future)
- Activity feed
- Alert management
- Templates

**7. Indexer Service**
- SubQuery wrapper
- Blockchain event processing
- Data synchronization
- WebSocket event publisher
- Historical data backfill

**8. Image Processing Service**
- Upload handling
- Resizing/optimization
- IPFS/Arweave upload
- Thumbnail generation
- Format conversion

### 3.2 API Design

#### RESTful Endpoints

**Authentication:**
```
POST   /api/auth/wallet/challenge      # Get signing message
POST   /api/auth/wallet/verify         # Verify signature, get JWT
POST   /api/auth/refresh               # Refresh access token
POST   /api/auth/logout                # Invalidate tokens
```

**Users:**
```
GET    /api/users/:address             # Get user profile
PUT    /api/users/me                   # Update own profile
GET    /api/users/:address/collections # User's collections
GET    /api/users/:address/nfts        # User's NFTs
GET    /api/users/:address/activity    # User's activity feed
```

**Collections:**
```
GET    /api/collections                # List collections (paginated)
GET    /api/collections/:id            # Get collection details
POST   /api/collections                # Create collection (deploy contract)
PUT    /api/collections/:id            # Update collection metadata
GET    /api/collections/:id/nfts       # Collection's NFTs
GET    /api/collections/:id/stats      # Collection statistics
```

**NFTs:**
```
GET    /api/nfts                       # List NFTs (paginated, filtered)
GET    /api/nfts/:id                   # Get NFT details
POST   /api/nfts                       # Mint NFT
GET    /api/nfts/:id/history           # Ownership/sale history
GET    /api/nfts/:id/offers            # Active offers on NFT
POST   /api/nfts/:id/refresh           # Refresh metadata
```

**Marketplace:**
```
GET    /api/listings                   # Active listings
GET    /api/listings/:id               # Listing details
POST   /api/listings                   # Create listing (prepare tx)
DELETE /api/listings/:id               # Cancel listing (prepare tx)
POST   /api/listings/:id/buy           # Buy NFT (prepare tx)

POST   /api/offers                     # Make offer (prepare tx)
GET    /api/offers/:id                 # Offer details
DELETE /api/offers/:id                 # Cancel offer
POST   /api/offers/:id/accept          # Accept offer (prepare tx)
```

**Auctions:**
```
GET    /api/auctions                   # Active auctions
GET    /api/auctions/:id               # Auction details
POST   /api/auctions                   # Create auction
POST   /api/auctions/:id/bid           # Place bid
GET    /api/auctions/:id/bids          # Bid history
POST   /api/auctions/:id/finalize      # Finalize auction
```

**Search:**
```
GET    /api/search                     # Search NFTs
GET    /api/search/collections         # Search collections
GET    /api/search/users               # Search users
GET    /api/search/suggest             # Autocomplete
```

**Analytics:**
```
GET    /api/analytics/platform         # Platform-wide stats
GET    /api/analytics/collections/:id  # Collection analytics
GET    /api/analytics/users/:address   # User analytics
GET    /api/analytics/trending         # Trending collections/NFTs
```

#### GraphQL Alternative (Future)

Consider GraphQL for:
- Complex nested queries
- Client-specific data fetching
- Reducing over-fetching
- Better developer experience

### 3.3 Database Schema

**PostgreSQL Tables:**

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(56) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    twitter_handle VARCHAR(50),
    instagram_handle VARCHAR(50),
    website_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);

-- Collections
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_address VARCHAR(56) UNIQUE NOT NULL,
    creator_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    description TEXT,
    image_url TEXT,
    banner_url TEXT,
    base_uri TEXT,
    royalty_receiver VARCHAR(56),
    royalty_bps INTEGER DEFAULT 0,
    total_supply INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_collections_creator ON collections(creator_id);
CREATE INDEX idx_collections_contract ON collections(contract_address);

-- NFTs
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id),
    token_id BIGINT NOT NULL,
    owner_id UUID REFERENCES users(id),
    creator_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    metadata_uri TEXT NOT NULL,
    metadata JSONB,
    rarity_score NUMERIC(10, 2),
    rarity_rank INTEGER,
    minted_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(collection_id, token_id)
);
CREATE INDEX idx_nfts_collection ON nfts(collection_id);
CREATE INDEX idx_nfts_owner ON nfts(owner_id);
CREATE INDEX idx_nfts_creator ON nfts(creator_id);
CREATE INDEX idx_nfts_metadata ON nfts USING GIN(metadata);

-- Listings
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id UUID REFERENCES nfts(id),
    seller_id UUID REFERENCES users(id),
    price NUMERIC(20, 7) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XLM',
    status VARCHAR(20) DEFAULT 'active', -- active, sold, cancelled, expired
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_listings_nft ON listings(nft_id);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);

-- Offers
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id UUID REFERENCES nfts(id),
    buyer_id UUID REFERENCES users(id),
    amount NUMERIC(20, 7) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XLM',
    status VARCHAR(20) DEFAULT 'active', -- active, accepted, cancelled, expired
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_offers_nft ON offers(nft_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_offers_status ON offers(status);

-- Auctions
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id UUID REFERENCES nfts(id),
    seller_id UUID REFERENCES users(id),
    starting_price NUMERIC(20, 7) NOT NULL,
    reserve_price NUMERIC(20, 7),
    current_bid NUMERIC(20, 7),
    current_bidder_id UUID REFERENCES users(id),
    bid_count INTEGER DEFAULT 0,
    auction_type VARCHAR(20), -- english, dutch, sealed
    status VARCHAR(20) DEFAULT 'active', -- active, finalized, cancelled
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_auctions_nft ON auctions(nft_id);
CREATE INDEX idx_auctions_seller ON auctions(seller_id);
CREATE INDEX idx_auctions_status ON auctions(status);

-- Bids
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id),
    bidder_id UUID REFERENCES users(id),
    amount NUMERIC(20, 7) NOT NULL,
    is_winning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);

-- Sales (historical)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id UUID REFERENCES nfts(id),
    seller_id UUID REFERENCES users(id),
    buyer_id UUID REFERENCES users(id),
    price NUMERIC(20, 7) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XLM',
    sale_type VARCHAR(20), -- listing, offer, auction
    transaction_hash VARCHAR(64) NOT NULL,
    platform_fee NUMERIC(20, 7),
    royalty_fee NUMERIC(20, 7),
    sold_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sales_nft ON sales(nft_id);
CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_buyer ON sales(buyer_id);
CREATE INDEX idx_sales_sold_at ON sales(sold_at);

-- Activities (general activity feed)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    nft_id UUID REFERENCES nfts(id),
    activity_type VARCHAR(50) NOT NULL, -- mint, transfer, list, sale, offer, bid, etc.
    metadata JSONB,
    transaction_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_nft ON activities(nft_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created ON activities(created_at);

-- Follows (social)
CREATE TABLE follows (
    follower_id UUID REFERENCES users(id),
    following_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Favorites
CREATE TABLE favorites (
    user_id UUID REFERENCES users(id),
    nft_id UUID REFERENCES nfts(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, nft_id)
);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_nft ON favorites(nft_id);
```

### 3.4 Caching Strategy

**Redis Key Patterns:**

```
# User data
user:profile:{address}              → User profile (TTL: 5 min)
user:nfts:{address}                 → User's NFTs (TTL: 1 min)
user:collections:{address}          → User's collections (TTL: 5 min)

# NFT data
nft:{collection}:{tokenId}          → NFT details (TTL: 5 min)
nft:metadata:{collection}:{tokenId} → Metadata (TTL: 1 hour)

# Collection data
collection:{contractAddress}        → Collection details (TTL: 10 min)
collection:stats:{contractAddress}  → Collection stats (TTL: 1 min)

# Marketplace
listings:active                     → Active listings sorted by time (TTL: 30 sec)
listings:collection:{id}            → Collection listings (TTL: 1 min)
auction:{id}                        → Auction details (TTL: 30 sec)

# Search
search:trending                     → Trending collections (TTL: 5 min)
search:recent                       → Recent sales (TTL: 1 min)

# Analytics
analytics:platform:daily            → Daily platform stats (TTL: 1 hour)
analytics:collection:{id}:daily     → Collection daily stats (TTL: 1 hour)

# Session & Auth
session:{userId}                    → User session data (TTL: 24 hours)
ratelimit:api:{ip}                  → Rate limiting (TTL: 1 hour)
```

**Cache Invalidation:**
- On NFT transfer: Clear owner's cache
- On listing/sale: Clear collection and NFT cache
- On metadata update: Clear NFT metadata cache
- Use cache-aside pattern with TTL fallback

---

## 4. Frontend Architecture

### 4.1 Next.js Application Structure

```
/nuna-curate-frontend/
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (marketplace)/
│   │   │   ├── explore/
│   │   │   ├── collections/
│   │   │   │   └── [id]/
│   │   │   ├── nft/
│   │   │   │   └── [collection]/[tokenId]/
│   │   │   └── auctions/
│   │   ├── (user)/
│   │   │   ├── profile/[address]/
│   │   │   ├── create/
│   │   │   └── dashboard/
│   │   ├── api/                    # API routes (if needed)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── nft/
│   │   │   ├── NFTCard.tsx
│   │   │   ├── NFTDetail.tsx
│   │   │   └── NFTGrid.tsx
│   │   ├── marketplace/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── AuctionCard.tsx
│   │   │   └── BuyModal.tsx
│   │   ├── collection/
│   │   │   ├── CollectionHeader.tsx
│   │   │   └── CollectionStats.tsx
│   │   ├── user/
│   │   │   ├── UserProfile.tsx
│   │   │   └── UserAvatar.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── WalletButton.tsx
│   ├── lib/
│   │   ├── stellar/
│   │   │   ├── wallet.ts           # Wallet connection
│   │   │   ├── contracts.ts        # Contract interactions
│   │   │   └── utils.ts
│   │   ├── api/
│   │   │   ├── client.ts           # API client (axios/fetch)
│   │   │   └── endpoints.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useNFT.ts
│   │   │   ├── useMarketplace.ts
│   │   │   └── useWebSocket.ts
│   │   └── utils/
│   │       ├── format.ts
│   │       └── validation.ts
│   ├── types/
│   │   ├── nft.ts
│   │   ├── user.ts
│   │   └── marketplace.ts
│   └── styles/
│       └── themes/
├── public/
│   ├── images/
│   └── icons/
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### 4.2 State Management

**Zustand for Global State:**

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    user: User | null;
    walletAddress: string | null;
    isConnected: boolean;
    accessToken: string | null;

    connectWallet: (address: string) => Promise<void>;
    disconnect: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            walletAddress: null,
            isConnected: false,
            accessToken: null,

            connectWallet: async (address) => {
                // Implementation
            },
            disconnect: () => {
                set({ user: null, walletAddress: null, isConnected: false, accessToken: null });
            },
            setUser: (user) => set({ user })
        }),
        {
            name: 'auth-storage',
        }
    )
);
```

**SWR for Server State:**

```typescript
// hooks/useNFT.ts
import useSWR from 'swr';
import { api } from '@/lib/api/client';

export function useNFT(collection: string, tokenId: string) {
    const { data, error, isLoading } = useSWR(
        `/api/nfts/${collection}/${tokenId}`,
        api.get,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute
        }
    );

    return {
        nft: data,
        isLoading,
        isError: error
    };
}
```

### 4.3 Wallet Integration

```typescript
// lib/stellar/wallet.ts
import { StellarWalletsKit, WalletNetwork } from '@creit.tech/stellar-wallets-kit';

const walletsKit = new StellarWalletsKit({
    network: WalletNetwork.MAINNET,
    selectedWalletId: 'freighter',
    modules: [
        // Import specific wallet modules
    ]
});

export async function connectWallet() {
    await walletsKit.openModal({
        onWalletSelected: async (option) => {
            walletsKit.setWallet(option.id);
            const { address } = await walletsKit.getAddress();
            return address;
        }
    });
}

export async function signTransaction(xdr: string) {
    return await walletsKit.sign({ xdr });
}
```

### 4.4 WebSocket Integration

```typescript
// lib/hooks/useWebSocket.ts
import { useEffect, useState } from 'use';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
            transports: ['websocket']
        });

        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const subscribe = (event: string, callback: (data: any) => void) => {
        socket?.on(event, callback);
    };

    const unsubscribe = (event: string) => {
        socket?.off(event);
    };

    return { socket, isConnected, subscribe, unsubscribe };
}

// Usage in component
function AuctionPage({ auctionId }: { auctionId: string }) {
    const { subscribe, unsubscribe } = useWebSocket();

    useEffect(() => {
        subscribe(`auction:${auctionId}:bid`, (bid) => {
            // Update UI with new bid
        });

        return () => {
            unsubscribe(`auction:${auctionId}:bid`);
        };
    }, [auctionId]);
}
```

---

## 5. Data Flow & Integration

### 5.1 NFT Minting Flow

```
1. User uploads image/media
   ↓
2. Frontend → Backend: Upload to temporary storage
   ↓
3. Backend processes image (resize, optimize)
   ↓
4. Backend uploads to IPFS (via Pinata)
   ↓
5. Backend uploads to Arweave (permanent backup)
   ↓
6. Backend creates metadata JSON
   ↓
7. Backend uploads metadata to IPFS
   ↓
8. Frontend receives IPFS URIs
   ↓
9. User signs mint transaction (Soroban)
   ↓
10. Transaction submitted to Stellar
    ↓
11. Indexer detects mint event
    ↓
12. Backend updates database
    ↓
13. Frontend displays minted NFT
```

### 5.2 Listing/Sale Flow

```
1. User creates listing (price, expiry)
   ↓
2. Frontend prepares Soroban transaction
   ↓
3. User approves NFT to marketplace contract
   ↓
4. User signs listing transaction
   ↓
5. Transaction submitted to Stellar
   ↓
6. Indexer detects ListingCreated event
   ↓
7. Backend stores listing in database
   ↓
8. Listing appears on marketplace
   ↓

BUYER FLOW:
   ↓
9. Buyer clicks "Buy"
   ↓
10. Frontend prepares buy transaction (transfer XLM)
    ↓
11. Buyer signs transaction
    ↓
12. Transaction submitted
    ↓
13. Indexer detects Sale event
    ↓
14. Backend updates database (new owner, sale record)
    ↓
15. Royalties automatically distributed
    ↓
16. Both parties receive notifications
```

### 5.3 Real-Time Updates Flow

```
Stellar Network
  ↓ (new block/event)
Stellar RPC
  ↓
Indexer Service
  ├→ Database (PostgreSQL)
  └→ Message Queue (BullMQ)
       ↓
  WebSocket Server
       ↓
  Connected Clients (browsers)
```

---

## 6. Infrastructure & DevOps

### 6.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Production Environment                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CloudFlare CDN                                              │
│  ├── Static Assets (images, CSS, JS)                        │
│  └── IPFS Gateway Caching                                   │
│                                                              │
│  ┌─────────────┐                                            │
│  │   Vercel    │  (Frontend - Next.js)                      │
│  └─────┬───────┘                                            │
│        │                                                     │
│        │ HTTPS                                               │
│        ▼                                                     │
│  ┌─────────────────────────────────────────┐               │
│  │         AWS / GCP (Backend)             │               │
│  ├─────────────────────────────────────────┤               │
│  │  Application Load Balancer              │               │
│  │    │                                     │               │
│  │    ├─► API Service (ECS/Kubernetes)     │               │
│  │    │   └─► Multiple instances           │               │
│  │    │                                     │               │
│  │    ├─► WebSocket Service                │               │
│  │    │                                     │               │
│  │    └─► Worker Services (BullMQ)         │               │
│  │                                          │               │
│  │  ┌──────────────────────────────┐       │               │
│  │  │  Data Layer                  │       │               │
│  │  ├──────────────────────────────┤       │               │
│  │  │ PostgreSQL (RDS)             │       │               │
│  │  │   ├─ Primary (Multi-AZ)      │       │               │
│  │  │   └─ Read Replicas (x2)      │       │               │
│  │  │                               │       │               │
│  │  │ Redis (ElastiCache)          │       │               │
│  │  │   └─ Cluster mode             │       │               │
│  │  │                               │       │               │
│  │  │ Elasticsearch/Meilisearch    │       │               │
│  │  └──────────────────────────────┘       │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  External Services:                                          │
│  ├─ SubQuery (Indexing)                                     │
│  ├─ Pinata (IPFS)                                           │
│  ├─ Arweave (Permanent storage)                             │
│  ├─ SendGrid (Email)                                        │
│  └─ Sentry (Error tracking)                                 │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo test --all

  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
      - name: Build and push Docker image
        run: |
          docker build -t nuna-backend .
          docker push $ECR_REGISTRY/nuna-backend:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster nuna-cluster --service nuna-api --force-new-deployment
```

### 6.3 Monitoring & Observability

**Metrics to Track:**

1. **Application Metrics:**
   - API response times (p50, p95, p99)
   - Error rates by endpoint
   - Request volume
   - WebSocket connections

2. **Blockchain Metrics:**
   - Transaction success rate
   - Gas costs
   - Contract call latency
   - Indexer lag (time behind chain)

3. **Business Metrics:**
   - NFTs minted per day
   - Trading volume (XLM/USD)
   - Active users (DAU/MAU)
   - Marketplace fee revenue

4. **Infrastructure Metrics:**
   - CPU/Memory usage
   - Database connection pool
   - Cache hit rates
   - Queue depth

**Alerting Rules:**

```yaml
# Example: DataDog alerts
alerts:
  - name: High API Error Rate
    query: error_rate > 5%
    severity: critical
    notify: pagerduty, slack

  - name: Database Connection Pool Exhausted
    query: db.connections > 90% of max
    severity: critical
    notify: pagerduty

  - name: Indexer Lag
    query: current_block - indexed_block > 100
    severity: warning
    notify: slack

  - name: High Response Time
    query: p95_latency > 1000ms
    severity: warning
    notify: slack
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                  Security Layers                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Network Security                                     │
│     ├─ CloudFlare DDoS Protection                       │
│     ├─ WAF Rules                                         │
│     └─ Rate Limiting (multiple tiers)                   │
│                                                          │
│  2. Application Security                                 │
│     ├─ HTTPS Only (TLS 1.3)                             │
│     ├─ CORS Policies                                     │
│     ├─ Content Security Policy                           │
│     ├─ Input Validation                                  │
│     └─ SQL Injection Prevention                          │
│                                                          │
│  3. Authentication & Authorization                       │
│     ├─ Wallet Signature Verification                     │
│     ├─ JWT with short expiry (15 min)                   │
│     ├─ Refresh tokens (HTTP-only cookies)               │
│     └─ Role-Based Access Control                         │
│                                                          │
│  4. API Security                                         │
│     ├─ API Key for server-to-server                     │
│     ├─ Rate Limiting (per IP, per user)                 │
│     ├─ Request size limits                               │
│     └─ API versioning                                     │
│                                                          │
│  5. Smart Contract Security                              │
│     ├─ No Reentrancy (Soroban default)                  │
│     ├─ Access Control                                    │
│     ├─ Input Validation                                  │
│     ├─ Fail-Safe Defaults                                │
│     └─ Audit by certified firm                           │
│                                                          │
│  6. Data Security                                         │
│     ├─ Encryption at Rest (database)                     │
│     ├─ Encryption in Transit (TLS)                       │
│     ├─ Secrets Management (AWS Secrets Manager)          │
│     └─ Regular Backups (encrypted)                       │
│                                                          │
│  7. Operational Security                                 │
│     ├─ Least Privilege Access                            │
│     ├─ Multi-Factor Authentication (team)                │
│     ├─ Audit Logging                                      │
│     ├─ Incident Response Plan                            │
│     └─ Security Monitoring & Alerts                       │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Flow

```typescript
// Wallet-based authentication
export async function authenticateWallet(walletAddress: string): Promise<AuthTokens> {
    // 1. Request challenge
    const { challenge, expires } = await api.post('/auth/wallet/challenge', {
        walletAddress
    });

    // 2. Sign challenge with wallet
    const signature = await signMessage(challenge);

    // 3. Verify signature and get tokens
    const { accessToken, refreshToken } = await api.post('/auth/wallet/verify', {
        walletAddress,
        challenge,
        signature
    });

    // 4. Store tokens securely
    // accessToken in memory only
    // refreshToken in HTTP-only cookie (handled by backend)

    return { accessToken, refreshToken };
}
```

### 7.3 Rate Limiting Configuration

```typescript
// Rate limiting tiers
const rateLimits = {
    // Public endpoints
    public: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // 100 requests per window
    },

    // Authenticated users
    authenticated: {
        windowMs: 15 * 60 * 1000,
        max: 300
    },

    // Premium users
    premium: {
        windowMs: 15 * 60 * 1000,
        max: 1000
    },

    // Specific endpoints
    search: {
        windowMs: 60 * 1000, // 1 minute
        max: 20
    },

    upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10
    }
};
```

---

## 8. Scalability Plan

### 8.1 Horizontal Scaling Strategy

**Auto-scaling Configuration:**

```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nuna-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nuna-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### 8.2 Database Scaling

**Read Replicas:**
- Primary for writes
- 2+ replicas for reads
- Read queries distributed via load balancer

**Connection Pooling:**
```typescript
const pool = new Pool({
    max: 20, // max connections
    min: 5,  // min connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

**Query Optimization:**
- Index frequently queried columns
- Use materialized views for complex analytics
- Implement pagination on all list endpoints
- Cache expensive queries in Redis

### 8.3 Caching Strategy Evolution

**Level 1: In-Memory Cache (Redis)**
- Hot data (trending, recent sales)
- Session data
- Rate limiting counters

**Level 2: CDN Cache (CloudFlare)**
- Static assets
- NFT images (with long TTL)
- API responses (with short TTL)

**Level 3: Browser Cache**
- Service workers for offline support
- IndexedDB for user data

### 8.4 Queue Management

**Queue Types:**

1. **High Priority:** Critical operations
   - Sale confirmations
   - Royalty distributions
   - User notifications

2. **Normal Priority:** Standard operations
   - Metadata fetching
   - Image optimization
   - Analytics updates

3. **Low Priority:** Batch operations
   - Historical data backfill
   - Rarity calculations
   - Email digests

**Scaling Workers:**
```typescript
// BullMQ worker with concurrency
const worker = new Worker('nft-processing', async job => {
    // Process job
}, {
    connection: redisConnection,
    concurrency: 5, // process 5 jobs concurrently
    limiter: {
        max: 10, // max 10 jobs
        duration: 1000 // per second
    }
});
```

### 8.5 Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p95) | <200ms | <500ms |
| Page Load Time | <2s | <4s |
| NFT Image Load | <1s | <3s |
| Search Results | <100ms | <300ms |
| WebSocket Latency | <50ms | <200ms |
| Uptime | 99.9% | 99.5% |
| Database Query (p95) | <50ms | <200ms |
| Indexer Lag | <10 blocks | <100 blocks |

---

## Next Steps

1. **Phase 1: Foundation (Weeks 1-4)**
   - Set up development environment
   - Initialize repositories (monorepo structure recommended)
   - Deploy basic infrastructure (dev/staging)
   - Create NFT contract skeleton
   - Build simple frontend scaffolding

2. **Phase 2: Core Development (Weeks 5-12)**
   - Implement smart contracts
   - Build backend API
   - Develop frontend components
   - Set up indexer
   - Integration testing

3. **Phase 3: Testing & Security (Weeks 13-16)**
   - Comprehensive testing
   - Security audit
   - Bug bounty program
   - Performance optimization
   - Documentation

4. **Phase 4: Launch Preparation (Weeks 17-20)**
   - Mainnet deployment (gradual)
   - Community building
   - Marketing materials
   - Support systems
   - Monitoring dashboards

5. **Phase 5: Public Launch (Week 21+)**
   - Phased rollout
   - Continuous monitoring
   - Rapid iteration based on feedback
   - Feature expansion

---

**Document Status:** Technical Architecture Specification v1.0
**Maintainers:** Development Team
**Last Review:** November 15, 2024
**Next Review:** As architecture evolves
