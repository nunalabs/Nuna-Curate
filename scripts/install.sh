#!/bin/bash
set -e

echo "🔧 Installing pnpm 8.15.0..."

# Enable corepack (comes with Node 16.9+)
corepack enable

# Prepare specific pnpm version
corepack prepare pnpm@8.15.0 --activate

# Verify installation
echo "Installed pnpm version:"
pnpm --version

echo "✅ pnpm 8.15.0 installed successfully"

# Install dependencies (without frozen lockfile since we're building it)
echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "✅ Dependencies installed successfully"
