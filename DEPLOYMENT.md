# Nuna Curate Deployment Guide

Complete guide to deploy Nuna Curate to production on Stellar testnet.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   PRODUCTION STACK                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Frontend (Vercel)                                    │
│  └─ Next.js 14 app                                   │
│                                                       │
│  Backend (Railway/Render)                             │
│  └─ NestJS API                                       │
│                                                       │
│  Database (Supabase/Neon)                            │
│  └─ PostgreSQL                                        │
│                                                       │
│  Cache (Upstash)                                      │
│  └─ Redis                                            │
│                                                       │
│  Blockchain (Stellar Testnet)                         │
│  └─ Soroban Contracts                                │
│                                                       │
│  Storage (Pinata + Arweave)                          │
│  └─ IPFS + Permanent storage                         │
└──────────────────────────────────────────────────────┘
```

## Prerequisites

### Accounts Needed

1. **Vercel** - Frontend hosting (free tier OK)
2. **Railway** or **Render** - Backend hosting
3. **Supabase** or **Neon** - PostgreSQL database
4. **Upstash** - Redis hosting
5. **Pinata** - IPFS pinning
6. **Stellar** - Testnet account with XLM

## Step-by-Step Deployment

### 1. Deploy Smart Contracts to Testnet (15 min)

```bash
# Navigate to contracts
cd packages/contracts

# Build contracts
./scripts/build.sh

# Deploy to testnet
./scripts/deploy.sh testnet

# Save output - you'll get deployed-contracts.json with addresses
```

**Output Example:**
```json
{
  "network": "testnet",
  "contracts": {
    "nft_template": "CA...",
    "marketplace": "CB...",
    "royalty": "CC...",
    "factory": "CD..."
  }
}
```

**Initialize Marketplace:**
```bash
soroban contract invoke \
  --id <MARKETPLACE_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin <YOUR_ADDRESS> \
  --platform_fee_bps 250 \
  --fee_recipient <FEE_ADDRESS>
```

### 2. Setup Database - Supabase (10 min)

1. Go to [Supabase.com](https://supabase.com)
2. Create new project
3. Wait for database provisioning (~2 min)
4. Get connection string:
   - Settings → Database → Connection string
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Run Migrations:**
```bash
# Option A: Use TypeORM migrations (when created)
cd apps/backend
pnpm run migration:run

# Option B: Auto-sync in development (set in .env)
DATABASE_SYNC=true pnpm run dev
```

### 3. Setup Redis - Upstash (5 min)

1. Go to [Upstash.com](https://upstash.com)
2. Create Redis database
3. Choose region close to backend
4. Get connection details:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN

### 4. Setup Storage - Pinata (5 min)

1. Go to [Pinata.cloud](https://pinata.cloud)
2. Sign up for free account
3. Generate API keys:
   - Account → API Keys → New Key
   - Give full permissions
4. Save:
   - PINATA_API_KEY
   - PINATA_SECRET_KEY
   - PINATA_JWT

### 5. Deploy Backend - Railway (15 min)

#### Option A: Railway (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub:
   - Connect your repo
   - Select `apps/backend` as root directory
4. Set environment variables:

```env
# Database (from Supabase)
DATABASE_HOST=<supabase-host>
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<password>
DATABASE_NAME=postgres

# Redis (from Upstash)
REDIS_HOST=<upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-password>

# JWT (generate secure random strings)
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>

# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contracts (from deployment)
CONTRACT_MARKETPLACE=<from-deployed-contracts.json>
CONTRACT_NFT_TEMPLATE=<from-deployed-contracts.json>
CONTRACT_FACTORY=<from-deployed-contracts.json>

# IPFS (from Pinata)
PINATA_API_KEY=<your-key>
PINATA_SECRET_KEY=<your-secret>
PINATA_JWT=<your-jwt>

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# Port
PORT=3001
```

5. Deploy!
6. Note your backend URL: `https://your-backend.railway.app`

#### Option B: Render

1. Go to [Render.com](https://render.com)
2. New → Web Service
3. Connect repo, select `apps/backend`
4. Build Command: `cd apps/backend && pnpm install && pnpm run build`
5. Start Command: `cd apps/backend && pnpm run start:prod`
6. Add same environment variables as Railway

### 6. Deploy Frontend - Vercel (10 min)

1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm run build --filter=@nuna-curate/web`
   - **Install Command**: `pnpm install`

4. Set Environment Variables:

```env
# API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1

# Stellar
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contracts (from deployment)
NEXT_PUBLIC_CONTRACT_MARKETPLACE=<from-deployed-contracts.json>
NEXT_PUBLIC_CONTRACT_NFT_TEMPLATE=<from-deployed-contracts.json>
NEXT_PUBLIC_CONTRACT_FACTORY=<from-deployed-contracts.json>
```

5. Deploy!
6. Your frontend URL: `https://your-app.vercel.app`

### 7. Update CORS in Backend

Update `CORS_ORIGIN` in Railway to match your Vercel URL:

```env
CORS_ORIGIN=https://your-app.vercel.app
```

Redeploy backend.

### 8. Test the Deployment

1. Visit your Vercel URL
2. Click "Connect Wallet"
3. Connect Freighter wallet (testnet)
4. Try exploring (even with placeholder data)
5. Check backend health: `https://your-backend.railway.app/api/docs`

## Environment Variables Summary

### Frontend (.env.local → Vercel)
```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=
NEXT_PUBLIC_CONTRACT_MARKETPLACE=
NEXT_PUBLIC_CONTRACT_NFT_TEMPLATE=
NEXT_PUBLIC_CONTRACT_FACTORY=
```

### Backend (.env → Railway/Render)
```env
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=
JWT_REFRESH_SECRET=
STELLAR_NETWORK=testnet
STELLAR_SOROBAN_RPC_URL=
CONTRACT_MARKETPLACE=
CONTRACT_NFT_TEMPLATE=
PINATA_API_KEY=
PINATA_SECRET_KEY=
PINATA_JWT=
CORS_ORIGIN=
PORT=3001
```

## Cost Estimate (Monthly)

### Free Tier Setup
- **Vercel**: Free (Hobby plan)
- **Railway**: $5/month (500 hours)
- **Supabase**: Free (up to 500MB database)
- **Upstash**: Free (10K commands/day)
- **Pinata**: Free (1GB storage)
- **Total**: ~$5/month

### Production Ready
- **Vercel Pro**: $20/month
- **Railway Pro**: $20/month
- **Supabase Pro**: $25/month
- **Upstash**: $10/month
- **Pinata Pro**: $20/month
- **Total**: ~$95/month

## Monitoring & Maintenance

### Health Checks

1. **Frontend**: Vercel provides analytics
2. **Backend**: Railway provides logs & metrics
3. **Database**: Supabase dashboard
4. **Contracts**: Stellar Expert - https://stellar.expert

### Logs

```bash
# Railway CLI
railway logs

# Vercel CLI
vercel logs <deployment-url>
```

### Common Issues

**Backend can't connect to database:**
- Check DATABASE_* environment variables
- Verify Supabase allows connections
- Check if IP is whitelisted (Supabase → Database → Settings)

**Wallet won't connect:**
- Check NEXT_PUBLIC_STELLAR_NETWORK matches wallet network
- Verify contract addresses are correct
- Clear browser cache

**CORS errors:**
- Update CORS_ORIGIN in backend
- Redeploy backend after changing

## Next Steps After Deployment

1. **Test all features** on testnet
2. **Create sample NFTs** for demo
3. **Invite testers** to try the platform
4. **Monitor logs** for errors
5. **Gather feedback** and iterate
6. **Prepare for mainnet** when ready

## Mainnet Migration Checklist

- [ ] Audit smart contracts
- [ ] Test extensively on testnet
- [ ] Deploy contracts to mainnet
- [ ] Update all NEXT_PUBLIC_STELLAR_NETWORK=mainnet
- [ ] Update RPC URLs to mainnet
- [ ] Update contract addresses
- [ ] Set up monitoring & alerts
- [ ] Prepare customer support
- [ ] Launch! 🚀

## Support

For deployment issues:
- Railway: [railway.app/help](https://railway.app/help)
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
