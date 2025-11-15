# Vercel Deployment Setup for Nuna Curate

## ⚙️ Project Settings

### General Settings

**Framework Preset:**
```
Next.js
```

**Root Directory:**
```
./
```
(Leave at root - monorepo setup)

**Node.js Version:**
```
20.x
```

### Build & Development Settings

The `vercel.json` file handles most settings automatically, but verify these if needed:

**Build Command:**
```
turbo run build --filter=@nuna-curate/web
```

**Output Directory:**
```
apps/web/.next
```

**Install Command:**
```
pnpm install --frozen-lockfile
```

**Development Command:**
```
turbo run dev --filter=@nuna-curate/web
```

## 🔐 Environment Variables

**CRITICAL:** Add these in Vercel Dashboard → Settings → Environment Variables

### Required for All Environments

```bash
# Enable pnpm 8.x support (CRITICAL!)
ENABLE_EXPERIMENTAL_COREPACK=1

# API Backend URL
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1

# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

### Optional (Add after deploying contracts)

```bash
# Smart Contract Addresses (from testnet deployment)
NEXT_PUBLIC_NFT_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🚀 Deployment Steps

### Option 1: From GitHub (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `nunalabs/Nuna-Curate`
3. Configure project:
   - **Project Name**: `nuna-curate` (or your choice)
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `./` (keep at root)
4. Add Environment Variables (see above)
5. Click "Deploy"

### Option 2: From CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from project root
cd /path/to/Nuna-Curate
vercel

# For production
vercel --prod
```

## 🐛 Troubleshooting

### Error: "pnpm version incompatible"

**Solution:** Add this environment variable in Vercel:
```
ENABLE_EXPERIMENTAL_COREPACK=1
```

### Error: "Turbo not found"

**Solution:** Verify `vercel.json` uses the correct build command:
```json
{
  "buildCommand": "turbo run build --filter=@nuna-curate/web"
}
```

### Error: "Module @nuna-curate/shared not found"

**Solution:**
1. Ensure Root Directory is `./` (not `apps/web`)
2. Install command must be `pnpm install --frozen-lockfile`
3. Build must happen from root to include workspace packages

### Error: "Build exceeded time limit"

**Solutions:**
- Upgrade to Vercel Pro (longer build times)
- Or optimize build by adding to `turbo.json`:
  ```json
  {
    "globalDependencies": ["**/.env.*local"],
    "pipeline": {
      "build": {
        "cache": true
      }
    }
  }
  ```

### Build succeeds but site shows errors

**Check:**
1. Environment variables are set correctly
2. `NEXT_PUBLIC_API_URL` points to your deployed backend
3. Backend is deployed and accessible
4. CORS is configured in backend for your Vercel domain

## ✅ Verification Checklist

After deployment, verify:

- [ ] Site loads at your Vercel URL
- [ ] No console errors (check browser DevTools)
- [ ] Wallet connection button appears
- [ ] Environment variables are loaded (check Network tab)
- [ ] Pages navigate correctly
- [ ] Images and assets load

## 📝 Post-Deployment

### Update Backend URL

Once backend is deployed to Railway:

1. Get Railway backend URL: `https://your-backend.railway.app`
2. Update in Vercel:
   - Go to Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to `https://your-backend.railway.app/api/v1`
3. Redeploy: Deployments → ⋮ → Redeploy

### Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your domain (e.g., `nunacurate.com`)
3. Configure DNS as instructed

### Enable Auto-Deploy

- ✅ Production Branch: `main` (already configured)
- ✅ Deploy on push: Enabled
- ✅ Deploy previews: Enabled for all branches

## 🔗 Useful Links

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Turborepo on Vercel](https://vercel.com/docs/monorepos/turborepo)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## 🆘 Need Help?

If deployment fails:
1. Check build logs in Vercel Dashboard
2. Look for the specific error message
3. Verify all environment variables are set
4. Ensure `ENABLE_EXPERIMENTAL_COREPACK=1` is set
5. Try redeploying with "Clear Cache and Redeploy"
