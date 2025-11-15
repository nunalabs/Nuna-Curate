# Nuna Curate Frontend

Modern, responsive NFT marketplace frontend built with Next.js 14, deployed on Vercel.

## Features

- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **Stellar Wallet Integration** (Freighter, Albedo)
- **Real-time Updates** with SWR
- **Responsive Design** - Mobile-first approach
- **Type-safe** with TypeScript
- **Professional UI Components** (Radix UI)

## Tech Stack

- Next.js 14.1.0
- React 18
- TypeScript
- Tailwind CSS
- Stellar SDK
- stellar-wallets-kit (Freighter)
- Zustand (state management)
- SWR (data fetching)
- Radix UI (components)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your values
```

### Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contract Addresses
NEXT_PUBLIC_CONTRACT_MARKETPLACE=C...
NEXT_PUBLIC_CONTRACT_NFT_TEMPLATE=C...
NEXT_PUBLIC_CONTRACT_FACTORY=C...
```

### Development

```bash
# Run development server
pnpm run dev

# Open http://localhost:3000
```

### Build

```bash
# Create production build
pnpm run build

# Start production server
pnpm run start
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── home/            # Home page components
│   ├── layout/          # Layout components (Header, Footer)
│   ├── ui/              # Reusable UI components
│   └── wallet/          # Wallet integration components
└── lib/
    ├── wallet/          # Wallet provider & hooks
    └── utils.ts         # Utility functions
```

## Key Features

### Wallet Integration

Connect to Stellar wallets with one click:
- Freighter (recommended)
- Albedo
- XBULL
- WalletConnect support

### Responsive Design

Mobile-first approach with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Performance

- Image optimization with Next.js Image
- Route prefetching
- SWR caching
- Code splitting

## Components

### UI Components

- Button
- Dialog
- Dropdown Menu
- Avatar
- Tabs
- Tooltip
- Separator

### Layout Components

- **Header**: Navigation, wallet button, search
- **Footer**: Links, social media, copyright

### Home Components

- **Hero**: Main landing section
- **TrendingCollections**: Top collections
- **FeaturedNFTs**: Curated NFTs
- **HowItWorks**: Onboarding steps

## Deployment on Vercel

### Automatic Deployment

1. Push to GitHub
2. Connect to Vercel
3. Vercel auto-deploys on push

### Manual Deployment

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_STELLAR_NETWORK
NEXT_PUBLIC_STELLAR_RPC_URL
NEXT_PUBLIC_CONTRACT_MARKETPLACE
NEXT_PUBLIC_CONTRACT_NFT_TEMPLATE
NEXT_PUBLIC_CONTRACT_FACTORY
```

## Building for Production

### Optimization Checklist

- [ ] Set production API URL
- [ ] Configure mainnet contracts
- [ ] Enable analytics (optional)
- [ ] Set up error tracking (Sentry)
- [ ] Configure caching headers
- [ ] Enable image optimization
- [ ] Set up monitoring

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## License

[To be determined]
