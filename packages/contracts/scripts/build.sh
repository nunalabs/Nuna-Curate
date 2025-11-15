#!/bin/bash

# Build all Soroban contracts for Nuna Curate
# Usage: ./scripts/build.sh

set -e

echo "🔨 Building Nuna Curate Smart Contracts..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build each contract
CONTRACTS=("nft" "marketplace" "royalty" "factory")

for contract in "${CONTRACTS[@]}"; do
    if [ -d "$contract" ]; then
        echo -e "${BLUE}Building $contract contract...${NC}"
        cd "$contract"
        cargo build --target wasm32-unknown-unknown --release
        cd ..
        echo -e "${GREEN}✓ $contract built successfully${NC}"
        echo ""
    else
        echo "Warning: $contract directory not found, skipping..."
    fi
done

echo -e "${GREEN}✓ All contracts built successfully!${NC}"
echo ""
echo "Build artifacts located in:"
echo "  target/wasm32-unknown-unknown/release/"
echo ""
echo "Next steps:"
echo "  1. Run tests: cargo test --all"
echo "  2. Deploy: ./scripts/deploy.sh testnet"
