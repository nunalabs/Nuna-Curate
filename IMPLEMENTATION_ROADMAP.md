# Nuna Curate: Implementation Roadmap & Quick Start Guide

**Version:** 1.0
**Last Updated:** November 15, 2024
**Purpose:** Actionable guide to start building Nuna Curate

---

## Executive Summary

This roadmap provides a concrete path to launch Nuna Curate, the first comprehensive NFT marketplace on Stellar's Soroban platform. Based on extensive research of leading NFT platforms and emerging 2024-2025 trends, this guide prioritizes features that will differentiate Nuna Curate while ensuring a solid technical foundation.

**Key Differentiators:**
1. First full-featured marketplace on Soroban (launched Feb 2024)
2. 5-second finality and low costs (Stellar advantages)
3. Fractional NFT ownership (pioneer on Stellar)
4. Superior UX with account abstraction
5. Phygital NFT support from day one

---

## Phase 1: MVP Foundation (Months 1-3)

### Month 1: Setup & Smart Contracts

#### Week 1-2: Project Initialization

**Repository Setup:**
```bash
# Create monorepo structure
mkdir nuna-curate && cd nuna-curate
pnpm init

# Initialize workspaces
mkdir -p packages/{contracts,backend,frontend,shared}

# Initialize each package
cd packages/contracts && cargo init --lib
cd ../backend && pnpm init
cd ../frontend && pnpx create-next-app@latest . --typescript --tailwind --app
cd ../shared && pnpm init
```

**Recommended Monorepo Structure:**
```
nuna-curate/
├── packages/
│   ├── contracts/          # Soroban smart contracts (Rust)
│   ├── backend/            # NestJS API
│   ├── frontend/           # Next.js app
│   └── shared/             # Shared types/utils
├── pnpm-workspace.yaml
├── turbo.json              # Turborepo config
└── README.md
```

**Apply for Funding:**
- [ ] Stellar Community Fund application (up to $150K)
- [ ] Soroban Security Audit Bank (free audit credits)
- [ ] Join Stellar Discord and developer community

**Infrastructure Setup:**
- [ ] Set up AWS/GCP account
- [ ] Create GitHub organization
- [ ] Set up development domains
- [ ] Configure CI/CD (GitHub Actions)

#### Week 3-4: Core Smart Contracts

**Priority Contracts:**

1. **NFT Contract (ERC-721 equivalent)**
```rust
// packages/contracts/src/nft.rs
use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {
    pub fn mint(
        env: Env,
        to: Address,
        token_id: u64,
        metadata_uri: String
    ) -> Result<(), Error> {
        // Implementation based on soroban-examples
        // Reference: OpenZeppelin Stellar Contracts
    }

    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: u64
    ) -> Result<(), Error> {
        // Check ownership
        // Update storage
        // Emit transfer event
    }

    // ... other standard functions
}
```

2. **Marketplace Contract**
```rust
// packages/contracts/src/marketplace.rs
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    pub fn create_listing(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        price: i128,
        expiry: u64
    ) -> Result<u64, Error> {
        // Verify NFT ownership
        // Create listing
        // Return listing ID
    }

    pub fn buy(
        env: Env,
        listing_id: u64
    ) -> Result<(), Error> {
        // Verify listing active
        // Transfer payment
        // Distribute royalties
        // Transfer NFT
        // Emit sale event
    }
}
```

3. **Royalty Manager**
```rust
// Using OpenZeppelin Stellar Contracts library
// packages/contracts/src/royalty.rs
```

**Testing Strategy:**
```bash
# Run all contract tests
cd packages/contracts
cargo test

# Test on local Soroban
soroban contract build
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/nft.wasm

# Test on Stellar testnet
soroban contract deploy --network testnet --wasm target/wasm32-unknown-unknown/release/nft.wasm
```

**Resources:**
- Reference: https://github.com/stellar/soroban-examples
- Use: https://github.com/litemint/litemint-soroban-contracts
- Library: OpenZeppelin Stellar Contracts (royalties)

### Month 2: Backend Development

#### Week 1-2: API Foundation

**NestJS Setup:**
```bash
cd packages/backend
pnpm install @nestjs/core @nestjs/common @nestjs/platform-express
pnpm install @nestjs/typeorm typeorm pg
pnpm install @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm install stellar-sdk
```

**Core Modules:**
```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // config
    }),
    AuthModule,
    UsersModule,
    NFTsModule,
    CollectionsModule,
    MarketplaceModule,
  ],
})
export class AppModule {}
```

**Priority Endpoints (MVP):**
```typescript
// src/nfts/nfts.controller.ts
@Controller('nfts')
export class NFTsController {
  @Get()
  findAll(@Query() query: PaginationDto) {
    // List NFTs with filters
  }

  @Get(':collection/:tokenId')
  findOne(
    @Param('collection') collection: string,
    @Param('tokenId') tokenId: string
  ) {
    // Get NFT details
  }

  @Post('metadata')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMetadata(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: CreateNFTDto
  ) {
    // Upload to IPFS via Pinata
    // Return metadata URI
  }
}
```

**Database Schema (Initial):**
```sql
-- Create initial tables (users, collections, nfts, listings)
-- Run migrations
npm run migration:run
```

#### Week 3-4: Blockchain Integration

**Stellar/Soroban Integration:**
```typescript
// src/stellar/stellar.service.ts
@Injectable()
export class StellarService {
  private server: Server;

  constructor() {
    this.server = new Server(process.env.STELLAR_RPC_URL);
  }

  async callContract(
    contractId: string,
    method: string,
    params: xdr.ScVal[]
  ): Promise<any> {
    // Simulate contract call
    // Parse results
  }

  async submitTransaction(xdr: string): Promise<string> {
    // Submit transaction
    // Return transaction hash
  }
}
```

**Indexer Service (Simple Version):**
```typescript
// src/indexer/indexer.service.ts
@Injectable()
export class IndexerService {
  @Cron('*/10 * * * * *') // Every 10 seconds
  async indexNewBlocks() {
    // Get latest indexed block
    // Fetch new blocks from Stellar RPC
    // Parse events (Mint, Transfer, Sale)
    // Update database
  }
}
```

**IPFS Integration (Pinata):**
```typescript
// src/storage/ipfs.service.ts
@Injectable()
export class IPFSService {
  async uploadFile(file: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    return response.data.IpfsHash;
  }

  async uploadJSON(metadata: object): Promise<string> {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    return response.data.IpfsHash;
  }
}
```

### Month 3: Frontend Development

#### Week 1-2: Core UI Components

**Install Dependencies:**
```bash
cd packages/frontend
pnpm install @stellar/stellar-sdk @creit.tech/stellar-wallets-kit
pnpm install zustand swr axios
pnpm install @radix-ui/react-* # UI components
pnpm install lucide-react # Icons
```

**Wallet Connection:**
```typescript
// lib/stellar/wallet.ts
import { StellarWalletsKit, WalletNetwork } from '@creit.tech/stellar-wallets-kit';

export const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET, // Change to MAINNET for production
  selectedWalletId: 'freighter',
});

export async function connectWallet() {
  await kit.openModal({
    onWalletSelected: async (option) => {
      kit.setWallet(option.id);
      const { address } = await kit.getAddress();
      return address;
    }
  });
}
```

**Key Components:**
```typescript
// components/nft/NFTCard.tsx
export function NFTCard({ nft }: { nft: NFT }) {
  return (
    <div className="rounded-lg border bg-card">
      <img src={nft.image_url} alt={nft.name} />
      <div className="p-4">
        <h3>{nft.name}</h3>
        <p className="text-muted-foreground">{nft.collection.name}</p>
        {nft.listing && (
          <div className="mt-2">
            <span className="font-bold">{nft.listing.price} XLM</span>
          </div>
        )}
      </div>
    </div>
  );
}

// components/marketplace/BuyButton.tsx
export function BuyButton({ listingId, price }: BuyButtonProps) {
  const { connectWallet, address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  async function handleBuy() {
    if (!address) {
      await connectWallet();
      return;
    }

    setIsLoading(true);
    try {
      // Call backend to prepare transaction
      const { xdr } = await api.post(`/marketplace/listings/${listingId}/buy`);

      // Sign with wallet
      const { signedXDR } = await kit.sign({ xdr });

      // Submit transaction
      await api.post(`/marketplace/submit`, { xdr: signedXDR });

      toast.success('Purchase successful!');
    } catch (error) {
      toast.error('Purchase failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleBuy} disabled={isLoading}>
      {isLoading ? 'Processing...' : `Buy for ${price} XLM`}
    </Button>
  );
}
```

#### Week 3-4: Core Pages

**Key Pages for MVP:**
1. **Home/Explore:** Browse NFTs, trending collections
2. **Collection Page:** View all NFTs in a collection
3. **NFT Detail Page:** View single NFT, buy/make offer
4. **Profile Page:** View user's NFTs and collections
5. **Create Page:** Mint new NFT

**Example Implementation:**
```typescript
// app/nft/[collection]/[tokenId]/page.tsx
export default async function NFTPage({ params }) {
  const nft = await fetchNFT(params.collection, params.tokenId);

  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img src={nft.image_url} alt={nft.name} className="rounded-lg" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">{nft.name}</h1>
          <p className="text-muted-foreground">{nft.description}</p>

          {nft.listing ? (
            <div className="mt-6 p-6 border rounded-lg">
              <div className="text-2xl font-bold">{nft.listing.price} XLM</div>
              <BuyButton listingId={nft.listing.id} price={nft.listing.price} />
            </div>
          ) : (
            <div className="mt-6 p-6 border rounded-lg">
              <p>Not for sale</p>
              <MakeOfferButton nftId={nft.id} />
            </div>
          )}

          <NFTDetails nft={nft} />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 2: Enhanced Features (Months 4-6)

### Month 4: Auctions & Advanced Search

**Auction Contract:**
- Implement English auction (ascending price)
- Add Dutch auction (descending price) support
- Build auction UI components
- Real-time bid updates via WebSocket

**Search & Filtering:**
- Set up Meilisearch
- Index all NFTs with metadata
- Add trait-based filtering
- Implement rarity rankings

**Backend Tasks:**
```typescript
// Add auction endpoints
POST   /api/auctions
GET    /api/auctions/:id
POST   /api/auctions/:id/bid
POST   /api/auctions/:id/finalize

// Add search endpoints
GET    /api/search?q=...&traits=...&minPrice=...&maxPrice=...
```

### Month 5: Collections & Creator Tools

**Collection Features:**
- Batch minting UI
- Collection management dashboard
- Collection verification process
- Featured collections

**Creator Dashboard:**
```typescript
// app/dashboard/page.tsx
export default function CreatorDashboard() {
  const { data: stats } = useSWR('/api/analytics/creator/me');

  return (
    <div>
      <h1>Creator Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Total Sales" value={stats.totalSales} />
        <StatCard title="Total Earnings" value={stats.totalEarnings} />
        <StatCard title="NFTs Minted" value={stats.nftsMinted} />
      </div>
      <RecentSales />
      <TopCollections />
    </div>
  );
}
```

**Analytics Service:**
- Track creator earnings
- Calculate collection stats (floor price, volume, holders)
- Generate sales reports
- Provide trend analysis

### Month 6: Mobile Optimization & Social Features

**Mobile Improvements:**
- PWA implementation (service workers)
- Touch gestures for image viewing
- Mobile-optimized navigation
- Push notification support (future)

**Social Features:**
```sql
-- Add social tables
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE favorites (
  user_id UUID REFERENCES users(id),
  nft_id UUID REFERENCES nfts(id),
  PRIMARY KEY (user_id, nft_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nft_id UUID REFERENCES nfts(id),
  content TEXT,
  created_at TIMESTAMP
);
```

**Activity Feed:**
```typescript
// components/ActivityFeed.tsx
export function ActivityFeed() {
  const { data: activities } = useSWR('/api/activities/feed');

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

---

## Phase 3: Innovation (Months 7-12)

### Month 7-8: Fractional NFTs

**Smart Contract:**
```rust
// packages/contracts/src/fractional.rs
pub struct FractionalNFT;

#[contractimpl]
impl FractionalNFT {
    pub fn fractionalize(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        shares: u64,
        price_per_share: i128
    ) -> Result<Address, Error> {
        // Lock original NFT
        // Create fractional token contract
        // Mint shares to creator
        // Return fraction token address
    }

    pub fn buyShare(
        env: Env,
        fraction_contract: Address,
        shares: u64
    ) -> Result<(), Error> {
        // Transfer payment
        // Transfer share tokens
    }

    pub fn redeem(
        env: Env,
        fraction_contract: Address
    ) -> Result<(), Error> {
        // Verify all shares collected
        // Burn fraction tokens
        // Transfer original NFT
    }
}
```

**Frontend:**
```typescript
// app/nft/[id]/fractionalize/page.tsx
export default function FractionalizePage({ params }) {
  const [totalShares, setTotalShares] = useState(100);
  const [pricePerShare, setPricePerShare] = useState(10);

  async function handleFractionalize() {
    // Deploy fractional contract
    // Lock NFT
    // Mint shares
  }

  return (
    <div>
      <h1>Fractionalize NFT</h1>
      <Input
        label="Total Shares"
        value={totalShares}
        onChange={e => setTotalShares(e.target.value)}
      />
      <Input
        label="Price per Share (XLM)"
        value={pricePerShare}
        onChange={e => setPricePerShare(e.target.value)}
      />
      <Button onClick={handleFractionalize}>
        Fractionalize
      </Button>
    </div>
  );
}
```

### Month 9-10: NFT Lending/Rental

**Lending Contract:**
```rust
pub struct LendingContract;

#[contractimpl]
impl LendingContract {
    pub fn create_loan_offer(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        loan_amount: i128,
        interest_bps: u32,
        duration: u64
    ) -> Result<u64, Error> {
        // Escrow NFT
        // Create loan offer
        // Return offer ID
    }

    pub fn accept_loan(
        env: Env,
        offer_id: u64
    ) -> Result<(), Error> {
        // Transfer loan amount to borrower
        // Start loan period
    }

    pub fn repay_loan(
        env: Env,
        loan_id: u64
    ) -> Result<(), Error> {
        // Receive repayment + interest
        // Return NFT to borrower
    }

    pub fn liquidate(
        env: Env,
        loan_id: u64
    ) -> Result<(), Error> {
        // Verify loan expired
        // Transfer NFT to lender
    }
}
```

### Month 11-12: Dynamic NFTs & Advanced Features

**Dynamic NFT Support:**
- Oracle integration (Chainlink if available on Stellar)
- Metadata update mechanisms
- Evolving traits based on conditions
- Gaming integration examples

**Phygital Features:**
```typescript
// components/phygital/VerifyPhysical.tsx
export function VerifyPhysical({ nft }) {
  const [nfcData, setNfcData] = useState(null);

  async function scanNFC() {
    if ('NDEFReader' in window) {
      const reader = new NDEFReader();
      await reader.scan();
      reader.onreading = (event) => {
        setNfcData(event.serialNumber);
        // Verify against blockchain record
      };
    }
  }

  return (
    <div>
      <Button onClick={scanNFC}>Scan Physical Item</Button>
      {nfcData && <VerificationStatus data={nfcData} />}
    </div>
  );
}
```

---

## Critical Milestones & Checkpoints

### Pre-Launch Checklist

**Security:**
- [ ] Smart contracts audited by certified firm (use Soroban Audit Bank)
- [ ] Bug bounty program launched (2-4 weeks before mainnet)
- [ ] Penetration testing completed
- [ ] Rate limiting tested under load
- [ ] All secrets rotated and secured

**Performance:**
- [ ] Load testing: 1000+ concurrent users
- [ ] API response times <200ms (p95)
- [ ] Database queries optimized
- [ ] CDN configured and tested
- [ ] Auto-scaling validated

**Legal & Compliance:**
- [ ] Terms of Service reviewed by lawyer
- [ ] Privacy Policy compliant (GDPR if applicable)
- [ ] Creator agreements prepared
- [ ] Platform fee structure defined
- [ ] Tax implications understood

**Operations:**
- [ ] Monitoring dashboards configured
- [ ] Alert rules set up
- [ ] On-call rotation established
- [ ] Incident response plan documented
- [ ] Backup and recovery tested

**Marketing:**
- [ ] Website and landing page live
- [ ] Social media accounts active (Twitter, Discord)
- [ ] Press kit prepared
- [ ] Influencer partnerships initiated
- [ ] Launch campaign planned

---

## Technology Quick Reference

### Smart Contracts (Rust/Soroban)

**Setup:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
cargo install --locked soroban-cli

# Create new contract
soroban contract init nft-contract
cd nft-contract
```

**Build & Deploy:**
```bash
# Build
soroban contract build

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nft.wasm \
  --network testnet
```

**Useful Commands:**
```bash
# Invoke contract
soroban contract invoke \
  --id CONTRACT_ID \
  --network testnet \
  -- mint \
  --to GXXX... \
  --token_id 1 \
  --metadata_uri ipfs://...

# Get contract storage
soroban contract read \
  --id CONTRACT_ID \
  --network testnet
```

### Backend (NestJS)

**Quick Start:**
```bash
# Create new NestJS project
npx @nestjs/cli new backend
cd backend

# Generate modules
nest generate module nfts
nest generate controller nfts
nest generate service nfts

# Run development server
npm run start:dev
```

**Database Migrations:**
```bash
# Generate migration
npm run migration:generate -- -n CreateNFTsTable

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Frontend (Next.js)

**Quick Start:**
```bash
# Create new Next.js project
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir

cd frontend
npm run dev
```

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC=https://soroban-testnet.stellar.org
```

---

## Resources & Support

### Official Documentation
- **Stellar Developers:** https://developers.stellar.org/
- **Soroban Docs:** https://soroban.stellar.org/
- **Soroban Examples:** https://github.com/stellar/soroban-examples

### Community
- **Stellar Discord:** https://discord.gg/stellar
- **Stellar Stack Exchange:** https://stellar.stackexchange.com/
- **Developer Google Group:** stellar-dev@googlegroups.com

### Funding Opportunities
- **Stellar Community Fund:** https://communityfund.stellar.org/
- **Soroban Adoption Fund:** Apply through Stellar Foundation
- **Security Audit Bank:** Contact Stellar Foundation

### Example Projects
- **Litemint Marketplace:** https://github.com/litemint/litemint-soroban-contracts
- **Soroban React Template:** https://github.com/paltalabs/soroban-react
- **Scaffold Soroban:** https://github.com/stellar/scaffold-soroban

### Development Tools
- **Soroban CLI:** Command-line interface for contracts
- **Scout:** Security vulnerability detector
- **SubQuery:** Blockchain indexing service
- **Pinata:** IPFS pinning service

---

## Risk Management

### Technical Risks

**Risk:** Smart contract bugs
**Mitigation:**
- Comprehensive testing (unit, integration, fuzzing)
- Professional audit (use Soroban Audit Bank)
- Bug bounty program
- Gradual rollout (whitelisted → limited → public)

**Risk:** Scalability issues
**Mitigation:**
- Load testing before launch
- Auto-scaling infrastructure
- Database optimization from day one
- CDN for static assets

**Risk:** Soroban platform immaturity
**Mitigation:**
- Stay engaged with Stellar Foundation
- Contribute to ecosystem (report bugs, share learnings)
- Build modular architecture (easier to adapt)
- Have contingency plans

### Market Risks

**Risk:** Low Stellar/Soroban adoption
**Mitigation:**
- Plan for cross-chain bridges (future)
- Focus on creating value beyond just trading
- Build strong community
- Partner with other Stellar projects

**Risk:** NFT market downturn
**Mitigation:**
- Focus on utility NFTs (not just collectibles)
- Build sustainable revenue model
- Diversify use cases (art, music, gaming, phygital)
- Long-term vision

### Operational Risks

**Risk:** Team scaling challenges
**Mitigation:**
- Hire gradually based on milestones
- Strong documentation from day one
- Clear roles and responsibilities
- Regular retrospectives

**Risk:** Funding runway
**Mitigation:**
- Apply for multiple grants
- Milestone-based development
- Control burn rate
- Revenue from platform fees early

---

## Success Metrics

### Launch (Month 3)
- [ ] 100+ creators onboarded
- [ ] 1,000+ NFTs minted
- [ ] $10K+ trading volume
- [ ] <500ms API response times
- [ ] 99%+ uptime

### Growth (Month 6)
- [ ] 500+ active creators
- [ ] 10,000+ NFTs
- [ ] $100K+ monthly volume
- [ ] 5,000+ registered users
- [ ] 3+ major partnerships

### Maturity (Month 12)
- [ ] 2,000+ active creators
- [ ] 50,000+ NFTs
- [ ] $500K+ monthly volume
- [ ] 25,000+ users
- [ ] Profitable (platform fees > costs)

---

## Next Actions (Week 1)

1. **Day 1-2: Team Alignment**
   - Review research findings
   - Confirm technical stack
   - Define roles and responsibilities
   - Set up communication channels

2. **Day 3-4: Infrastructure**
   - Create GitHub organization
   - Set up AWS/GCP accounts
   - Initialize monorepo
   - Configure CI/CD basics

3. **Day 5-7: Begin Development**
   - Start NFT smart contract
   - Set up NestJS backend skeleton
   - Initialize Next.js frontend
   - Create first database migrations

4. **Ongoing:**
   - Apply for Stellar Community Fund
   - Join Stellar Discord and introduce project
   - Begin building community (Twitter, Discord)
   - Document everything

---

**Remember:** Build in public, engage the community early, and focus on creating real value for creators and collectors. The Soroban ecosystem is new—you have the opportunity to set the standard for NFT marketplaces on Stellar.

**Good luck building Nuna Curate!**
