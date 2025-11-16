#!/bin/bash

# ============================================================================
# NUNA CURATE - STELLAR TESTNET DEPLOYMENT SCRIPT
# ============================================================================
# Production-ready deployment script with comprehensive error handling
# and contract initialization
#
# Usage: ./scripts/deploy-testnet.sh
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# ============================================================================
# CONFIGURATION
# ============================================================================

NETWORK="testnet"
DEPLOYER_KEY="nuna-deployer"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
RPC_URL="https://soroban-testnet.stellar.org:443"
HORIZON_URL="https://horizon-testnet.stellar.org"

# Contract names
NFT_CONTRACT_NAME="nuna_nft"
MARKETPLACE_CONTRACT_NAME="nuna_marketplace"

# Platform configuration
PLATFORM_FEE_BPS=250  # 2.5%
DEFAULT_ROYALTY_BPS=500  # 5%

# Output
OUTPUT_DIR="./deployed"
OUTPUT_FILE="$OUTPUT_DIR/testnet-contracts.json"
ENV_FILE="$OUTPUT_DIR/.env.testnet"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_section() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check balance of account
check_balance() {
    local address=$1
    local balance=$(curl -s "$HORIZON_URL/accounts/$address" | jq -r '.balances[] | select(.asset_type=="native") | .balance' || echo "0")
    echo "$balance"
}

# Wait for user confirmation
wait_for_confirmation() {
    read -p "$(echo -e ${YELLOW}Press ENTER to continue...${NC})"
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

log_section "🚀 NUNA CURATE TESTNET DEPLOYMENT"

log_info "Checking prerequisites..."

# Check if soroban-cli is installed
if ! command_exists soroban; then
    log_error "soroban-cli not found. Please install it:"
    echo "  cargo install --locked soroban-cli"
    exit 1
fi
log_success "soroban-cli found: $(soroban --version)"

# Check if jq is installed (for JSON parsing)
if ! command_exists jq; then
    log_warning "jq not found. Installing via homebrew (macOS)..."
    if command_exists brew; then
        brew install jq
    else
        log_error "Please install jq manually: https://stedolan.github.io/jq/"
        exit 1
    fi
fi
log_success "jq found"

# Check if contracts are built
log_info "Checking if contracts are built..."
if [ ! -d "target/wasm32-unknown-unknown/release" ]; then
    log_warning "Contracts not built. Building now..."
    ./scripts/build.sh
fi
log_success "Contracts built"

# Verify WASM files exist
if [ ! -f "target/wasm32-unknown-unknown/release/${NFT_CONTRACT_NAME}.wasm" ]; then
    log_error "NFT contract WASM not found"
    exit 1
fi
if [ ! -f "target/wasm32-unknown-unknown/release/${MARKETPLACE_CONTRACT_NAME}.wasm" ]; then
    log_error "Marketplace contract WASM not found"
    exit 1
fi
log_success "All WASM files found"

# Create output directory
mkdir -p "$OUTPUT_DIR"
log_success "Output directory ready: $OUTPUT_DIR"

# ============================================================================
# NETWORK CONFIGURATION
# ============================================================================

log_section "⚙️  NETWORK CONFIGURATION"

# Check if network is configured
if ! soroban network ls 2>/dev/null | grep -q "$NETWORK"; then
    log_info "Configuring $NETWORK network..."
    soroban network add \
        --global "$NETWORK" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE"
    log_success "Network configured"
else
    log_success "Network already configured"
fi

# ============================================================================
# DEPLOYER ACCOUNT SETUP
# ============================================================================

log_section "👤 DEPLOYER ACCOUNT"

# Check if deployer key exists
if ! soroban keys show "$DEPLOYER_KEY" >/dev/null 2>&1; then
    log_info "Generating deployer key..."
    soroban keys generate "$DEPLOYER_KEY" --network "$NETWORK"
    log_success "Deployer key generated"
else
    log_success "Deployer key found"
fi

DEPLOYER_ADDRESS=$(soroban keys address "$DEPLOYER_KEY")
log_info "Deployer address: $DEPLOYER_ADDRESS"

# Check balance
BALANCE=$(check_balance "$DEPLOYER_ADDRESS")
log_info "Current balance: $BALANCE XLM"

if (( $(echo "$BALANCE < 100" | bc -l) )); then
    log_warning "Low balance detected. Funding required."
    echo ""
    echo "Please fund the deployer account with at least 100 XLM (testnet)"
    echo ""
    echo "  Address: $DEPLOYER_ADDRESS"
    echo ""
    echo "  Option 1 - Friendbot (automated):"
    echo "  curl \"https://friendbot.stellar.org?addr=$DEPLOYER_ADDRESS\""
    echo ""
    echo "  Option 2 - Laboratory (manual):"
    echo "  https://laboratory.stellar.org/#account-creator?network=test"
    echo ""

    # Try friendbot automatically
    log_info "Attempting to fund via Friendbot..."
    if curl -s "https://friendbot.stellar.org?addr=$DEPLOYER_ADDRESS" | jq -r '.successful' | grep -q "true"; then
        log_success "Account funded successfully via Friendbot!"
        sleep 5  # Wait for ledger confirmation
        BALANCE=$(check_balance "$DEPLOYER_ADDRESS")
        log_info "New balance: $BALANCE XLM"
    else
        log_warning "Friendbot failed. Please fund manually."
        wait_for_confirmation
    fi
fi

log_success "Deployer account ready with sufficient balance"

# ============================================================================
# CONTRACT DEPLOYMENT
# ============================================================================

log_section "📦 DEPLOYING CONTRACTS"

# Initialize JSON output
cat > "$OUTPUT_FILE" << EOF
{
  "network": "$NETWORK",
  "rpc_url": "$RPC_URL",
  "network_passphrase": "$NETWORK_PASSPHRASE",
  "deployer": "$DEPLOYER_ADDRESS",
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {}
}
EOF

# Deploy NFT Contract
log_info "Deploying NFT contract..."
NFT_CONTRACT_ID=$(soroban contract deploy \
    --wasm "target/wasm32-unknown-unknown/release/${NFT_CONTRACT_NAME}.wasm" \
    --source "$DEPLOYER_KEY" \
    --network "$NETWORK" 2>&1 | tail -n 1)

if [ -z "$NFT_CONTRACT_ID" ]; then
    log_error "NFT contract deployment failed"
    exit 1
fi

log_success "NFT contract deployed"
log_info "  Contract ID: $NFT_CONTRACT_ID"

# Update JSON
jq ".contracts.nft_template = \"$NFT_CONTRACT_ID\"" "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

# Deploy Marketplace Contract
log_info "Deploying Marketplace contract..."
MARKETPLACE_CONTRACT_ID=$(soroban contract deploy \
    --wasm "target/wasm32-unknown-unknown/release/${MARKETPLACE_CONTRACT_NAME}.wasm" \
    --source "$DEPLOYER_KEY" \
    --network "$NETWORK" 2>&1 | tail -n 1)

if [ -z "$MARKETPLACE_CONTRACT_ID" ]; then
    log_error "Marketplace contract deployment failed"
    exit 1
fi

log_success "Marketplace contract deployed"
log_info "  Contract ID: $MARKETPLACE_CONTRACT_ID"

# Update JSON
jq ".contracts.marketplace = \"$MARKETPLACE_CONTRACT_ID\"" "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

# Get XLM token address (Stellar Asset Contract for native XLM)
# On testnet, this is a well-known address
XLM_TOKEN_ADDRESS="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
log_info "XLM Token Address: $XLM_TOKEN_ADDRESS"

# ============================================================================
# CONTRACT INITIALIZATION
# ============================================================================

log_section "🔧 INITIALIZING CONTRACTS"

# Initialize Marketplace
log_info "Initializing Marketplace contract..."

MARKETPLACE_INIT=$(soroban contract invoke \
    --id "$MARKETPLACE_CONTRACT_ID" \
    --source "$DEPLOYER_KEY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$DEPLOYER_ADDRESS" \
    --platform_fee_bps "$PLATFORM_FEE_BPS" \
    --fee_recipient "$DEPLOYER_ADDRESS" \
    --xlm_token "$XLM_TOKEN_ADDRESS" 2>&1)

if echo "$MARKETPLACE_INIT" | grep -q "error"; then
    log_error "Marketplace initialization failed:"
    echo "$MARKETPLACE_INIT"
    exit 1
fi

log_success "Marketplace initialized"
log_info "  Platform fee: ${PLATFORM_FEE_BPS} bps ($(echo "scale=2; $PLATFORM_FEE_BPS / 100" | bc)%)"
log_info "  Fee recipient: $DEPLOYER_ADDRESS"

# Create a sample NFT collection for testing
log_info "Initializing sample NFT collection..."

COLLECTION_NAME="Nuna Test Collection"
COLLECTION_SYMBOL="NUNA"
BASE_URI="ipfs://QmTest/"

NFT_INIT=$(soroban contract invoke \
    --id "$NFT_CONTRACT_ID" \
    --source "$DEPLOYER_KEY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$DEPLOYER_ADDRESS" \
    --name "$COLLECTION_NAME" \
    --symbol "$COLLECTION_SYMBOL" \
    --base_uri "$BASE_URI" 2>&1)

if echo "$NFT_INIT" | grep -q "error"; then
    log_error "NFT initialization failed:"
    echo "$NFT_INIT"
    exit 1
fi

log_success "Sample NFT collection initialized"
log_info "  Name: $COLLECTION_NAME"
log_info "  Symbol: $COLLECTION_SYMBOL"

# Set default royalty on NFT contract
log_info "Setting default royalty..."

ROYALTY_INIT=$(soroban contract invoke \
    --id "$NFT_CONTRACT_ID" \
    --source "$DEPLOYER_KEY" \
    --network "$NETWORK" \
    -- set_default_royalty \
    --admin "$DEPLOYER_ADDRESS" \
    --receiver "$DEPLOYER_ADDRESS" \
    --royalty_bps "$DEFAULT_ROYALTY_BPS" 2>&1)

if echo "$ROYALTY_INIT" | grep -q "error"; then
    log_warning "Royalty setting failed (non-critical):"
    echo "$ROYALTY_INIT"
else
    log_success "Default royalty set to ${DEFAULT_ROYALTY_BPS} bps ($(echo "scale=2; $DEFAULT_ROYALTY_BPS / 100" | bc)%)"
fi

# ============================================================================
# GENERATE ENV FILE
# ============================================================================

log_section "📝 GENERATING ENVIRONMENT FILE"

cat > "$ENV_FILE" << EOF
# ============================================================================
# NUNA CURATE - TESTNET ENVIRONMENT VARIABLES
# Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ============================================================================

# Network Configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=$RPC_URL
STELLAR_HORIZON_URL=$HORIZON_URL
STELLAR_NETWORK_PASSPHRASE="$NETWORK_PASSPHRASE"

# Contract Addresses
NFT_CONTRACT_ID=$NFT_CONTRACT_ID
MARKETPLACE_CONTRACT_ID=$MARKETPLACE_CONTRACT_ID
XLM_TOKEN_ADDRESS=$XLM_TOKEN_ADDRESS

# Deployer Account
DEPLOYER_ADDRESS=$DEPLOYER_ADDRESS

# Platform Configuration
PLATFORM_FEE_BPS=$PLATFORM_FEE_BPS
FEE_RECIPIENT=$DEPLOYER_ADDRESS
DEFAULT_ROYALTY_BPS=$DEFAULT_ROYALTY_BPS

# Sample Collection
SAMPLE_COLLECTION_NAME="$COLLECTION_NAME"
SAMPLE_COLLECTION_SYMBOL=$COLLECTION_SYMBOL
SAMPLE_COLLECTION_BASE_URI=$BASE_URI

# Frontend URLs (update these for your deployment)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_NFT_CONTRACT_ID=$NFT_CONTRACT_ID
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID=$MARKETPLACE_CONTRACT_ID
NEXT_PUBLIC_STELLAR_RPC_URL=$RPC_URL

# Backend Configuration
INDEXER_START_LEDGER=$(curl -s "$HORIZON_URL/ledgers?order=desc&limit=1" | jq -r '._embedded.records[0].sequence')
INDEXER_POLL_INTERVAL=5000
EOF

log_success "Environment file generated: $ENV_FILE"

# ============================================================================
# FINAL SUMMARY
# ============================================================================

log_section "🎉 DEPLOYMENT COMPLETE!"

echo ""
echo "Contract Addresses:"
echo "  NFT Template:    $NFT_CONTRACT_ID"
echo "  Marketplace:     $MARKETPLACE_CONTRACT_ID"
echo "  XLM Token:       $XLM_TOKEN_ADDRESS"
echo ""
echo "Configuration:"
echo "  Platform Fee:    ${PLATFORM_FEE_BPS} bps ($(echo "scale=2; $PLATFORM_FEE_BPS / 100" | bc)%)"
echo "  Default Royalty: ${DEFAULT_ROYALTY_BPS} bps ($(echo "scale=2; $DEFAULT_ROYALTY_BPS / 100" | bc)%)"
echo "  Fee Recipient:   $DEPLOYER_ADDRESS"
echo ""
echo "Files Generated:"
echo "  Contract Info:   $OUTPUT_FILE"
echo "  Environment:     $ENV_FILE"
echo ""
echo "Next Steps:"
echo ""
echo "  1. Copy environment variables to your backend:"
echo "     cp $ENV_FILE ../../apps/backend/.env.local"
echo ""
echo "  2. Copy environment variables to your frontend:"
echo "     cp $ENV_FILE ../../apps/web/.env.local"
echo ""
echo "  3. Test NFT minting:"
echo "     soroban contract invoke --id $NFT_CONTRACT_ID \\"
echo "       --source $DEPLOYER_KEY --network $NETWORK \\"
echo "       -- mint \\"
echo "       --to $DEPLOYER_ADDRESS \\"
echo "       --token_id 1 \\"
echo "       --metadata '{\"name\":\"Test NFT\",\"description\":\"First NFT\",\"image_uri\":\"ipfs://test\",\"metadata_uri\":\"ipfs://test\"}'"
echo ""
echo "  4. View contracts on Stellar Expert:"
echo "     https://stellar.expert/explorer/testnet/contract/$NFT_CONTRACT_ID"
echo "     https://stellar.expert/explorer/testnet/contract/$MARKETPLACE_CONTRACT_ID"
echo ""

log_success "Deployment successful! 🚀"
