#!/bin/bash

# ============================================================================
# NUNA CURATE - BUILD AND TEST SCRIPT
# ============================================================================
# Comprehensive build and testing script for Soroban contracts
#
# Usage: ./scripts/build-and-test.sh [--release] [--skip-tests]
# ============================================================================

set -e
set -u
set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
RELEASE_MODE=false
SKIP_TESTS=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --release)
            RELEASE_MODE=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--release] [--skip-tests]"
            exit 1
            ;;
    esac
done

# Helper functions
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

# Start
log_section "🏗️  NUNA CURATE CONTRACT BUILD & TEST"

# Check for Rust
if ! command -v rustc >/dev/null 2>&1; then
    log_error "Rust not found. Please install: https://rustup.rs/"
    exit 1
fi

RUST_VERSION=$(rustc --version)
log_success "Rust found: $RUST_VERSION"

# Check for wasm32 target
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    log_warning "wasm32-unknown-unknown target not installed. Installing..."
    rustup target add wasm32-unknown-unknown
fi
log_success "wasm32-unknown-unknown target ready"

# Check for soroban-cli
if ! command -v soroban >/dev/null 2>&1; then
    log_warning "soroban-cli not found. Installing..."
    cargo install --locked soroban-cli
fi

SOROBAN_VERSION=$(soroban --version)
log_success "soroban-cli found: $SOROBAN_VERSION"

# ============================================================================
# CLEAN PREVIOUS BUILD
# ============================================================================

log_section "🧹 CLEANING"

log_info "Removing previous build artifacts..."
cargo clean
log_success "Build directory cleaned"

# ============================================================================
# FORMAT CHECK
# ============================================================================

log_section "📐 CODE FORMATTING"

log_info "Checking code format..."
if cargo fmt -- --check; then
    log_success "Code is properly formatted"
else
    log_warning "Code formatting issues detected. Running formatter..."
    cargo fmt
    log_success "Code formatted"
fi

# ============================================================================
# LINTING
# ============================================================================

log_section "🔍 LINTING"

log_info "Running Clippy..."
if cargo clippy --all-targets --all-features -- -D warnings; then
    log_success "No linting issues found"
else
    log_error "Linting failed. Please fix the issues above."
    exit 1
fi

# ============================================================================
# TESTS
# ============================================================================

if [ "$SKIP_TESTS" = false ]; then
    log_section "🧪 RUNNING TESTS"

    # NFT Contract Tests
    log_info "Testing NFT contract..."
    cd nft
    TEST_OUTPUT=$(cargo test --  --nocapture 2>&1)
    TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -o "[0-9]* passed" | awk '{print $1}')

    if echo "$TEST_OUTPUT" | grep -q "test result: ok"; then
        log_success "NFT contract: $TEST_COUNT tests passed ✓"
    else
        log_error "NFT contract tests failed"
        echo "$TEST_OUTPUT"
        exit 1
    fi
    cd ..

    # Marketplace Contract Tests
    log_info "Testing Marketplace contract..."
    cd marketplace
    TEST_OUTPUT=$(cargo test -- --nocapture 2>&1)
    TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -o "[0-9]* passed" | awk '{print $1}')

    if echo "$TEST_OUTPUT" | grep -q "test result: ok"; then
        log_success "Marketplace contract: $TEST_COUNT tests passed ✓"
    else
        log_error "Marketplace contract tests failed"
        echo "$TEST_OUTPUT"
        exit 1
    fi
    cd ..

    log_success "All tests passed! 🎉"
else
    log_warning "Skipping tests (--skip-tests flag used)"
fi

# ============================================================================
# BUILD CONTRACTS
# ============================================================================

log_section "📦 BUILDING CONTRACTS"

BUILD_FLAGS="--target wasm32-unknown-unknown"
if [ "$RELEASE_MODE" = true ]; then
    BUILD_FLAGS="$BUILD_FLAGS --release"
    log_info "Building in RELEASE mode..."
else
    log_info "Building in DEBUG mode..."
fi

# Build NFT Contract
log_info "Building NFT contract..."
cd nft
if cargo build $BUILD_FLAGS; then
    log_success "NFT contract built"
else
    log_error "NFT contract build failed"
    exit 1
fi
cd ..

# Build Marketplace Contract
log_info "Building Marketplace contract..."
cd marketplace
if cargo build $BUILD_FLAGS; then
    log_success "Marketplace contract built"
else
    log_error "Marketplace contract build failed"
    exit 1
fi
cd ..

# ============================================================================
# OPTIMIZE WASM (Release only)
# ============================================================================

if [ "$RELEASE_MODE" = true ]; then
    log_section "⚡ OPTIMIZING WASM"

    # Check for wasm-opt
    if command -v wasm-opt >/dev/null 2>&1; then
        log_info "Optimizing WASM files with wasm-opt..."

        # Optimize NFT contract
        wasm-opt -Oz \
            target/wasm32-unknown-unknown/release/nuna_nft.wasm \
            -o target/wasm32-unknown-unknown/release/nuna_nft_optimized.wasm

        # Optimize Marketplace contract
        wasm-opt -Oz \
            target/wasm32-unknown-unknown/release/nuna_marketplace.wasm \
            -o target/wasm32-unknown-unknown/release/nuna_marketplace_optimized.wasm

        log_success "WASM optimization complete"

        # Show size comparison
        NFT_ORIGINAL=$(wc -c < target/wasm32-unknown-unknown/release/nuna_nft.wasm)
        NFT_OPTIMIZED=$(wc -c < target/wasm32-unknown-unknown/release/nuna_nft_optimized.wasm)
        NFT_REDUCTION=$(echo "scale=2; (1 - $NFT_OPTIMIZED / $NFT_ORIGINAL) * 100" | bc)

        MARKET_ORIGINAL=$(wc -c < target/wasm32-unknown-unknown/release/nuna_marketplace.wasm)
        MARKET_OPTIMIZED=$(wc -c < target/wasm32-unknown-unknown/release/nuna_marketplace_optimized.wasm)
        MARKET_REDUCTION=$(echo "scale=2; (1 - $MARKET_OPTIMIZED / $MARKET_ORIGINAL) * 100" | bc)

        log_info "NFT: $(numfmt --to=iec-i --suffix=B $NFT_ORIGINAL) → $(numfmt --to=iec-i --suffix=B $NFT_OPTIMIZED) ($NFT_REDUCTION% reduction)"
        log_info "Marketplace: $(numfmt --to=iec-i --suffix=B $MARKET_ORIGINAL) → $(numfmt --to=iec-i --suffix=B $MARKET_OPTIMIZED) ($MARKET_REDUCTION% reduction)"
    else
        log_warning "wasm-opt not found. Install binaryen for WASM optimization:"
        log_warning "  brew install binaryen  # macOS"
        log_warning "  apt-get install binaryen  # Ubuntu"
    fi
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================

log_section "✨ BUILD SUMMARY"

if [ "$RELEASE_MODE" = true ]; then
    BUILD_DIR="target/wasm32-unknown-unknown/release"
else
    BUILD_DIR="target/wasm32-unknown-unknown/debug"
fi

echo ""
echo "Build Mode:     $([ "$RELEASE_MODE" = true ] && echo "RELEASE" || echo "DEBUG")"
echo "Tests:          $([ "$SKIP_TESTS" = true ] && echo "SKIPPED" || echo "PASSED")"
echo ""
echo "Contract WASMs:"
echo "  NFT:          $BUILD_DIR/nuna_nft.wasm"
echo "  Marketplace:  $BUILD_DIR/nuna_marketplace.wasm"

if [ "$RELEASE_MODE" = true ] && command -v wasm-opt >/dev/null 2>&1; then
    echo ""
    echo "Optimized WASMs:"
    echo "  NFT:          $BUILD_DIR/nuna_nft_optimized.wasm"
    echo "  Marketplace:  $BUILD_DIR/nuna_marketplace_optimized.wasm"
fi

echo ""
log_success "Build complete! 🚀"

if [ "$RELEASE_MODE" = true ]; then
    echo ""
    echo "Next steps:"
    echo "  1. Deploy to testnet:"
    echo "     ./scripts/deploy-testnet.sh"
    echo ""
    echo "  2. Or deploy to mainnet (when ready):"
    echo "     ./scripts/deploy-mainnet.sh"
fi
