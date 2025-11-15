#!/bin/bash

# Deploy Soroban contracts to Stellar network
# Usage: ./scripts/deploy.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}
DEPLOYER_KEY="deployer"

echo "🚀 Deploying Nuna Curate contracts to $NETWORK..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if contracts are built
if [ ! -d "target/wasm32-unknown-unknown/release" ]; then
    echo -e "${YELLOW}Contracts not built. Building now...${NC}"
    ./scripts/build.sh
fi

# Check if network is configured
if ! soroban network ls | grep -q "$NETWORK"; then
    echo -e "${YELLOW}Network $NETWORK not configured. Setting up...${NC}"

    if [ "$NETWORK" = "testnet" ]; then
        soroban network add \
            --global testnet \
            --rpc-url https://soroban-testnet.stellar.org:443 \
            --network-passphrase "Test SDF Network ; September 2015"
    fi
fi

# Check if deployer key exists
if ! soroban keys show $DEPLOYER_KEY 2>/dev/null; then
    echo -e "${YELLOW}Deployer key not found. Generating...${NC}"
    soroban keys generate $DEPLOYER_KEY --network $NETWORK

    DEPLOYER_ADDRESS=$(soroban keys address $DEPLOYER_KEY)
    echo ""
    echo -e "${YELLOW}⚠️  Please fund the deployer account:${NC}"
    echo "   Address: $DEPLOYER_ADDRESS"
    echo "   Fund at: https://laboratory.stellar.org/#account-creator?network=test"
    echo ""
    read -p "Press enter when account is funded..."
fi

# Create output file
OUTPUT_FILE="deployed-contracts.json"
echo "{" > $OUTPUT_FILE
echo "  \"network\": \"$NETWORK\"," >> $OUTPUT_FILE
echo "  \"deployer\": \"$(soroban keys address $DEPLOYER_KEY)\"," >> $OUTPUT_FILE
echo "  \"deployed_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> $OUTPUT_FILE
echo "  \"contracts\": {" >> $OUTPUT_FILE

# Deploy NFT Template
echo -e "${BLUE}Deploying NFT contract...${NC}"
NFT_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/nuna_nft.wasm \
    --source $DEPLOYER_KEY \
    --network $NETWORK)

echo -e "${GREEN}✓ NFT contract deployed: $NFT_ID${NC}"
echo "    \"nft_template\": \"$NFT_ID\"," >> $OUTPUT_FILE

# Deploy Marketplace
echo -e "${BLUE}Deploying Marketplace contract...${NC}"
MARKETPLACE_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/nuna_marketplace.wasm \
    --source $DEPLOYER_KEY \
    --network $NETWORK)

echo -e "${GREEN}✓ Marketplace contract deployed: $MARKETPLACE_ID${NC}"
echo "    \"marketplace\": \"$MARKETPLACE_ID\"," >> $OUTPUT_FILE

# Deploy Royalty (if exists)
if [ -f "target/wasm32-unknown-unknown/release/nuna_royalty.wasm" ]; then
    echo -e "${BLUE}Deploying Royalty contract...${NC}"
    ROYALTY_ID=$(soroban contract deploy \
        --wasm target/wasm32-unknown-unknown/release/nuna_royalty.wasm \
        --source $DEPLOYER_KEY \
        --network $NETWORK)

    echo -e "${GREEN}✓ Royalty contract deployed: $ROYALTY_ID${NC}"
    echo "    \"royalty\": \"$ROYALTY_ID\"," >> $OUTPUT_FILE
fi

# Deploy Factory (if exists)
if [ -f "target/wasm32-unknown-unknown/release/nuna_factory.wasm" ]; then
    echo -e "${BLUE}Deploying Factory contract...${NC}"
    FACTORY_ID=$(soroban contract deploy \
        --wasm target/wasm32-unknown-unknown/release/nuna_factory.wasm \
        --source $DEPLOYER_KEY \
        --network $NETWORK)

    echo -e "${GREEN}✓ Factory contract deployed: $FACTORY_ID${NC}"
    echo "    \"factory\": \"$FACTORY_ID\"" >> $OUTPUT_FILE
fi

# Close JSON
echo "  }" >> $OUTPUT_FILE
echo "}" >> $OUTPUT_FILE

echo ""
echo -e "${GREEN}✓ All contracts deployed successfully!${NC}"
echo ""
echo "Contract addresses saved to: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Initialize marketplace:"
echo "     soroban contract invoke --id $MARKETPLACE_ID \\"
echo "       --source $DEPLOYER_KEY --network $NETWORK \\"
echo "       -- initialize \\"
echo "       --admin $(soroban keys address $DEPLOYER_KEY) \\"
echo "       --platform_fee_bps 250 \\"
echo "       --fee_recipient $(soroban keys address $DEPLOYER_KEY)"
echo ""
echo "  2. Create NFT collection using factory"
echo "  3. Update backend .env with contract addresses"
