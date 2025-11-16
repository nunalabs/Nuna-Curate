#![no_std]

//! Nuna Curate Marketplace Contract
//!
//! Production-ready marketplace for buying and selling NFTs on Stellar Soroban.
//! Supports fixed-price listings, offers, and automatic royalty distribution.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

mod storage;
mod events;
mod errors;
mod royalty;

use storage::*;
use events::*;
use errors::Error;
use royalty::*;

#[contract]
pub struct MarketplaceContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone)]
pub struct Listing {
    pub listing_id: u64,
    pub nft_contract: Address,
    pub token_id: u64,
    pub seller: Address,
    pub price: i128,
    pub status: ListingStatus,
    pub created_at: u64,
    pub expires_at: Option<u64>,
}

#[contracttype]
#[derive(Clone)]
pub struct Offer {
    pub offer_id: u64,
    pub nft_contract: Address,
    pub token_id: u64,
    pub buyer: Address,
    pub amount: i128,
    pub expires_at: Option<u64>,
    pub created_at: u64,
}

#[contractimpl]
impl MarketplaceContract {
    /// Initialize the marketplace
    pub fn initialize(
        env: Env,
        admin: Address,
        platform_fee_bps: u32,
        fee_recipient: Address,
        xlm_token: Address,
    ) -> Result<(), Error> {
        if is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        // Validate fee (max 10% = 1000 bps)
        if platform_fee_bps > 1000 {
            return Err(Error::InvalidFee);
        }

        set_admin(&env, &admin);
        set_platform_fee(&env, platform_fee_bps);
        set_fee_recipient(&env, &fee_recipient);
        set_xlm_token_address(&env, &xlm_token);
        set_listing_counter(&env, 0);
        set_offer_counter(&env, 0);

        // Bump instance TTL on initialization
        bump_instance(&env);

        events::emit_marketplace_initialized(&env, &admin, platform_fee_bps);

        Ok(())
    }

    /// Create a fixed-price listing
    pub fn create_listing(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        seller: Address,
        price: i128,
        expires_at: Option<u64>,
    ) -> Result<u64, Error> {
        seller.require_auth();

        // Validate price
        if price <= 0 {
            return Err(Error::InvalidPrice);
        }

        // Validate expiry
        if let Some(expiry) = expires_at {
            let current_time = env.ledger().timestamp();
            if expiry <= current_time {
                return Err(Error::InvalidExpiry);
            }
        }

        // Generate listing ID
        let listing_id = get_and_increment_listing_counter(&env);

        // Create listing
        let listing = Listing {
            listing_id,
            nft_contract: nft_contract.clone(),
            token_id,
            seller: seller.clone(),
            price,
            status: ListingStatus::Active,
            created_at: env.ledger().timestamp(),
            expires_at,
        };

        save_listing(&env, listing_id, &listing);
        add_active_listing(&env, listing_id);

        events::emit_listing_created(
            &env,
            listing_id,
            &nft_contract,
            token_id,
            &seller,
            price,
        );

        Ok(listing_id)
    }

    /// Cancel a listing
    pub fn cancel_listing(
        env: Env,
        listing_id: u64,
        seller: Address,
    ) -> Result<(), Error> {
        seller.require_auth();

        let mut listing = get_listing(&env, listing_id)?;

        // Verify seller
        if listing.seller != seller {
            return Err(Error::Unauthorized);
        }

        // Check if already inactive
        if listing.status != ListingStatus::Active {
            return Err(Error::ListingNotActive);
        }

        // Update listing
        listing.status = ListingStatus::Cancelled;
        save_listing(&env, listing_id, &listing);
        remove_active_listing(&env, listing_id);

        events::emit_listing_cancelled(&env, listing_id, &seller);

        Ok(())
    }

    /// Buy NFT from listing
    pub fn buy(
        env: Env,
        listing_id: u64,
        buyer: Address,
    ) -> Result<(), Error> {
        buyer.require_auth();

        let mut listing = get_listing(&env, listing_id)?;

        // Verify listing is active
        if listing.status != ListingStatus::Active {
            return Err(Error::ListingNotActive);
        }

        // Check expiry
        if let Some(expiry) = listing.expires_at {
            if env.ledger().timestamp() > expiry {
                listing.status = ListingStatus::Expired;
                save_listing(&env, listing_id, &listing);
                remove_active_listing(&env, listing_id);
                return Err(Error::ListingExpired);
            }
        }

        // Cannot buy your own listing
        if listing.seller == buyer {
            return Err(Error::CannotBuyOwnListing);
        }

        // Calculate fees
        let platform_fee_bps = get_platform_fee(&env);
        let platform_fee = calculate_fee(listing.price, platform_fee_bps);

        // Get royalty info (if available)
        let (royalty_recipient, royalty_amount) = get_royalty_info(
            &env,
            &listing.nft_contract,
            listing.token_id,
            listing.price,
        );

        // Calculate seller proceeds
        let mut seller_proceeds = listing.price - platform_fee;
        if royalty_amount > 0 {
            seller_proceeds -= royalty_amount;
        }

        // Transfer payments
        transfer_xlm(&env, &buyer, &listing.seller, seller_proceeds)?;

        if platform_fee > 0 {
            let fee_recipient = get_fee_recipient(&env)?;
            transfer_xlm(&env, &buyer, &fee_recipient, platform_fee)?;
        }

        if royalty_amount > 0 {
            transfer_xlm(&env, &buyer, &royalty_recipient, royalty_amount)?;
        }

        // Transfer NFT (call transfer_from on NFT contract)
        transfer_nft(
            &env,
            &listing.nft_contract,
            &listing.seller,
            &buyer,
            listing.token_id,
        )?;

        // Update listing status
        listing.status = ListingStatus::Sold;
        save_listing(&env, listing_id, &listing);
        remove_active_listing(&env, listing_id);

        events::emit_sale(
            &env,
            listing_id,
            &listing.nft_contract,
            listing.token_id,
            &listing.seller,
            &buyer,
            listing.price,
            platform_fee,
            royalty_amount,
        );

        Ok(())
    }

    /// Make an offer on an NFT
    pub fn make_offer(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        buyer: Address,
        amount: i128,
        expires_at: Option<u64>,
    ) -> Result<u64, Error> {
        buyer.require_auth();

        // Validate amount
        if amount <= 0 {
            return Err(Error::InvalidPrice);
        }

        // Validate expiry
        if let Some(expiry) = expires_at {
            let current_time = env.ledger().timestamp();
            if expiry <= current_time {
                return Err(Error::InvalidExpiry);
            }
        }

        // Generate offer ID
        let offer_id = get_and_increment_offer_counter(&env);

        // Create offer
        let offer = Offer {
            offer_id,
            nft_contract: nft_contract.clone(),
            token_id,
            buyer: buyer.clone(),
            amount,
            expires_at,
            created_at: env.ledger().timestamp(),
        };

        save_offer(&env, offer_id, &offer);

        events::emit_offer_made(
            &env,
            offer_id,
            &nft_contract,
            token_id,
            &buyer,
            amount,
        );

        Ok(offer_id)
    }

    /// Accept an offer
    pub fn accept_offer(
        env: Env,
        offer_id: u64,
        seller: Address,
    ) -> Result<(), Error> {
        seller.require_auth();

        let offer = get_offer(&env, offer_id)?;

        // Check expiry
        if let Some(expiry) = offer.expires_at {
            if env.ledger().timestamp() > expiry {
                remove_offer(&env, offer_id);
                return Err(Error::OfferExpired);
            }
        }

        // Calculate fees (similar to buy)
        let platform_fee_bps = get_platform_fee(&env);
        let platform_fee = calculate_fee(offer.amount, platform_fee_bps);

        let (royalty_recipient, royalty_amount) = get_royalty_info(
            &env,
            &offer.nft_contract,
            offer.token_id,
            offer.amount,
        );

        let mut seller_proceeds = offer.amount - platform_fee;
        if royalty_amount > 0 {
            seller_proceeds -= royalty_amount;
        }

        // Transfer payments
        transfer_xlm(&env, &offer.buyer, &seller, seller_proceeds)?;

        if platform_fee > 0 {
            let fee_recipient = get_fee_recipient(&env)?;
            transfer_xlm(&env, &offer.buyer, &fee_recipient, platform_fee)?;
        }

        if royalty_amount > 0 {
            transfer_xlm(&env, &offer.buyer, &royalty_recipient, royalty_amount)?;
        }

        // Transfer NFT
        transfer_nft(
            &env,
            &offer.nft_contract,
            &seller,
            &offer.buyer,
            offer.token_id,
        )?;

        // Remove offer
        remove_offer(&env, offer_id);

        events::emit_offer_accepted(
            &env,
            offer_id,
            &offer.nft_contract,
            offer.token_id,
            &seller,
            &offer.buyer,
            offer.amount,
        );

        Ok(())
    }

    /// Cancel an offer
    pub fn cancel_offer(
        env: Env,
        offer_id: u64,
        buyer: Address,
    ) -> Result<(), Error> {
        buyer.require_auth();

        let offer = get_offer(&env, offer_id)?;

        if offer.buyer != buyer {
            return Err(Error::Unauthorized);
        }

        remove_offer(&env, offer_id);

        events::emit_offer_cancelled(&env, offer_id, &buyer);

        Ok(())
    }

    // ========== VIEW FUNCTIONS ==========

    pub fn get_listing(env: Env, listing_id: u64) -> Result<Listing, Error> {
        get_listing(&env, listing_id)
    }

    pub fn get_offer(env: Env, offer_id: u64) -> Result<Offer, Error> {
        get_offer(&env, offer_id)
    }

    pub fn get_platform_fee(env: Env) -> u32 {
        get_platform_fee(&env)
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        get_admin(&env)
    }

    // ========== ADMIN FUNCTIONS ==========

    pub fn set_platform_fee(
        env: Env,
        admin: Address,
        new_fee_bps: u32,
    ) -> Result<(), Error> {
        admin.require_auth();

        let current_admin = get_admin(&env)?;
        if current_admin != admin {
            return Err(Error::Unauthorized);
        }

        if new_fee_bps > 1000 {
            return Err(Error::InvalidFee);
        }

        set_platform_fee(&env, new_fee_bps);

        events::emit_fee_updated(&env, new_fee_bps);

        Ok(())
    }

    pub fn set_fee_recipient(
        env: Env,
        admin: Address,
        new_recipient: Address,
    ) -> Result<(), Error> {
        admin.require_auth();

        let current_admin = get_admin(&env)?;
        if current_admin != admin {
            return Err(Error::Unauthorized);
        }

        set_fee_recipient(&env, &new_recipient);

        Ok(())
    }
}

/// Calculate fee based on basis points
fn calculate_fee(amount: i128, fee_bps: u32) -> i128 {
    (amount * fee_bps as i128) / 10000
}

/// Transfer XLM between accounts using Stellar Asset Contract
fn transfer_xlm(
    env: &Env,
    from: &Address,
    to: &Address,
    amount: i128,
) -> Result<(), Error> {
    use soroban_sdk::token;

    // Get the native XLM token contract address
    // On Stellar mainnet/testnet, XLM is represented as a Stellar Asset Contract
    let xlm_address = get_xlm_token_address(env);

    // Create token client for XLM
    let xlm_token = token::Client::new(env, &xlm_address);

    // Transfer XLM from buyer to recipient
    // This will fail if buyer doesn't have enough balance or hasn't approved
    xlm_token.transfer(from, to, &amount);

    Ok(())
}

/// Transfer NFT via cross-contract call to NFT contract
fn transfer_nft(
    env: &Env,
    nft_contract: &Address,
    from: &Address,
    to: &Address,
    token_id: u64,
) -> Result<(), Error> {
    use nft_interface::NFTContractClient;

    // Create a client for the NFT contract using its interface
    // We'll call transfer_from as the marketplace (authorized operator)
    let nft_client = NFTContractClient::new(env, nft_contract);

    // The marketplace contract must be approved to transfer this NFT
    // This should have been done when the listing was created
    nft_client.transfer_from(
        &env.current_contract_address(), // spender (this marketplace)
        from,                             // current owner
        to,                               // new owner
        &token_id,
    );

    Ok(())
}

/// Get XLM token address for the current network
/// This is the Stellar Asset Contract (SAC) address for native XLM
fn get_xlm_token_address(env: &Env) -> Address {
    // On Stellar, native XLM has a deterministic contract address
    // This is computed from the Stellar Asset (native)
    // For now, we'll store it in contract storage during initialization
    storage::get_xlm_token_address(env)
        .expect("XLM token address not configured")
}

/// Client interface for calling NFT contract functions
mod nft_interface {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "NFTContractClient")]
    pub trait NFTContractInterface {
        /// Transfer NFT with approval (without Result for simplicity)
        fn transfer_from(
            env: Env,
            spender: Address,
            from: Address,
            to: Address,
            token_id: u64,
        );
    }
}

#[cfg(test)]
mod test;
