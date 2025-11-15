#!/bin/bash
set -e

echo "🔧 Installing pnpm 8.15.0..."

# Enable corepack (comes with Node 16.9+)
corepack enable

# Prepare specific pnpm version
corepack prepare pnpm@8.15.0 --activate

# Verify installation
pnpm --version

echo "✅ pnpm 8.15.0 installed successfully"

# Install dependencies
pnpm install --frozen-lockfile

echo "✅ Dependencies installed"
