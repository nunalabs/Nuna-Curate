use soroban_sdk::{Address, Env};

/// Get royalty information from NFT contract
///
/// Returns (recipient_address, royalty_amount)
/// Follows ERC-2981 standard for royalties
pub fn get_royalty_info(
    env: &Env,
    nft_contract: &Address,
    token_id: u64,
    sale_price: i128,
) -> (Address, i128) {
    use royalty_interface::NFTRoyaltyClient;

    // Create client for NFT contract's royalty interface
    let royalty_client = NFTRoyaltyClient::new(env, nft_contract);

    // Try to get royalty info, fallback to zero if not supported
    // This allows backwards compatibility with NFTs without royalties
    match royalty_client.try_royalty_info(&token_id, &sale_price) {
        Ok(result) => result,
        Err(_) => {
            // NFT doesn't support royalties, return zero
            let zero_address = env.current_contract_address();
            (zero_address, 0)
        }
    }
}

/// Interface for calling NFT contract royalty functions (ERC-2981)
mod royalty_interface {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "NFTRoyaltyClient")]
    pub trait NFTRoyaltyInterface {
        /// Get royalty info for a token sale
        /// Returns (receiver address, royalty amount)
        fn royalty_info(env: Env, token_id: u64, sale_price: i128) -> (Address, i128);
    }
}

/// Validate royalty percentage (in basis points)
/// Max 10% = 1000 bps
pub fn validate_royalty_bps(bps: u32) -> bool {
    bps <= 1000
}

/// Calculate royalty amount from price and basis points
pub fn calculate_royalty(price: i128, royalty_bps: u32) -> i128 {
    (price * royalty_bps as i128) / 10000
}
