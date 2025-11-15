# Nuna Curate Smart Contracts

Production-ready Soroban smart contracts for the Nuna Curate NFT marketplace on Stellar.

## Contracts

### 1. NFT Contract (`nft/`)
ERC-721 equivalent NFT contract with the following features:
- Minting and burning
- Transfer and approvals
- Token metadata management
- Collection management
- Role-based access control

### 2. Marketplace Contract (`marketplace/`)
Full-featured marketplace for buying and selling NFTs:
- Fixed-price listings
- Offers and counter-offers
- Automatic royalty distribution
- Platform fee management
- Listing expiration

### 3. Royalty Contract (`royalty/`)
ERC-2981 compliant royalty management:
- Default collection royalties
- Per-token royalty overrides
- Automatic royalty calculation

### 4. Collection Factory (`factory/`)
Factory contract for deploying new NFT collections:
- One-click collection deployment
- Standardized collection setup
- Royalty configuration

## Development

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --features opt
```

### Build Contracts

```bash
# Build all contracts
./scripts/build.sh

# Build specific contract
cd nft && cargo build --target wasm32-unknown-unknown --release
```

### Test Contracts

```bash
# Run all tests
cargo test --all

# Run specific contract tests
cd nft && cargo test

# Run tests with output
cargo test -- --nocapture
```

### Deploy to Testnet

```bash
# Configure Soroban for testnet
soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Create identity
soroban keys generate deployer --network testnet

# Fund account (get test XLM)
# Visit: https://laboratory.stellar.org/#account-creator?network=test

# Deploy contracts
./scripts/deploy.sh testnet

# Or deploy individually
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nuna_nft.wasm \
  --source deployer \
  --network testnet
```

### Initialize Contracts

```bash
# After deployment, initialize NFT collection
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --name "My Collection" \
  --symbol "MYC" \
  --base_uri "ipfs://..."

# Initialize marketplace
soroban contract invoke \
  --id <MARKETPLACE_CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --platform_fee_bps 250 \
  --fee_recipient <FEE_ADDRESS>
```

## Contract Addresses (Testnet)

After deployment, contract addresses will be saved to `deployed-contracts.json`:

```json
{
  "network": "testnet",
  "contracts": {
    "nft_template": "C...",
    "marketplace": "C...",
    "royalty": "C...",
    "factory": "C..."
  },
  "deployed_at": "2024-11-15T..."
}
```

## Security

### Audit Status
- [ ] Internal review completed
- [ ] External audit by certified firm
- [ ] Bug bounty program active

### Known Limitations
1. Cross-contract calls are placeholders (require full Soroban integration)
2. XLM transfers use placeholder (need Stellar Asset Contract integration)
3. Royalty queries need proper cross-contract invocation

### Security Best Practices
- All contracts use `require_auth()` for authorization
- Input validation on all parameters
- Reentrancy protection (Soroban default)
- Event emission for all state changes
- Comprehensive error handling

## Gas Optimization

Contracts are optimized for minimal gas usage:
- Use of `symbol_short!` for storage keys
- Efficient data structures
- Minimal storage operations
- Release profile with LTO and optimization

## Testing

Comprehensive test suite covering:
- Happy path scenarios
- Error conditions
- Authorization checks
- Edge cases
- Gas usage benchmarks

Run with:
```bash
cargo test --all -- --nocapture
```

## Monitoring

After deployment, monitor contract activity:
- Use Stellar Expert: https://stellar.expert/explorer/testnet
- Check events via Stellar RPC
- Monitor via SubQuery indexer

## Upgradeability

Contracts are currently non-upgradeable. For production:
- Consider implementing proxy pattern
- Use factory pattern for new versions
- Maintain backward compatibility
- Plan migration strategy

## License

[To be determined]

## Support

For questions or issues:
- GitHub Issues: [repository link]
- Discord: [community link]
- Documentation: [docs link]
