use soroban_sdk::{Address, Env};
use crate::{Listing, Offer, errors::Error};

// ============================================================================
// TTL CONFIGURATION (Time To Live for State Archival)
// ============================================================================
// Optimized TTL values to minimize storage costs while maintaining data integrity
//
// Soroban State Archival: https://soroban.stellar.org/docs/soroban-internals/state-archival
//
// - PERSISTENT storage: For permanent data (NFT ownership, collection info)
// - TEMPORARY storage: For time-bounded data (listings, offers, signatures)
//
// TTL (ledgers) = seconds / 5 (avg ledger time)
// ============================================================================

// Permanent data - extend frequently to prevent archival
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 518_400;  // ~30 days
const PERSISTENT_BUMP_AMOUNT: u32 = 1_036_800;       // ~60 days

// Active listings - moderate lifetime
const LISTING_LIFETIME_THRESHOLD: u32 = 172_800;     // ~10 days
const LISTING_BUMP_AMOUNT: u32 = 518_400;            // ~30 days

// Offers - shorter lifetime (more ephemeral)
const OFFER_LIFETIME_THRESHOLD: u32 = 86_400;        // ~5 days
const OFFER_BUMP_AMOUNT: u32 = 259_200;              // ~15 days

// Instance data - very long lifetime
const INSTANCE_LIFETIME_THRESHOLD: u32 = 1_036_800;  // ~60 days
const INSTANCE_BUMP_AMOUNT: u32 = 2_073_600;         // ~120 days

// Storage keys
const ADMIN_KEY: &str = "admin";
const PLATFORM_FEE_KEY: &str = "fee";
const FEE_RECIPIENT_KEY: &str = "fee_rcpt";
const LISTING_COUNTER_KEY: &str = "list_cnt";
const OFFER_COUNTER_KEY: &str = "offr_cnt";
const XLM_TOKEN_KEY: &str = "xlm_token";

fn listing_key(listing_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("listing")
}

fn offer_key(offer_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("offer")
}

fn active_listings_key() -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("act_list")
}

// ============================================================================
// TTL HELPER FUNCTIONS
// ============================================================================

/// Extend TTL for instance storage (contract configuration)
fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

/// Extend TTL for persistent storage (permanent data)
fn extend_persistent_ttl(env: &Env, key: &impl soroban_sdk::IntoVal<Env, soroban_sdk::Val>) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

/// Extend TTL for listing storage
fn extend_listing_ttl(env: &Env, listing_id: u64) {
    let key = &(listing_key(listing_id), listing_id);
    env.storage()
        .persistent()
        .extend_ttl(key, LISTING_LIFETIME_THRESHOLD, LISTING_BUMP_AMOUNT);
}

/// Extend TTL for offer storage
fn extend_offer_ttl(env: &Env, offer_id: u64) {
    let key = &(offer_key(offer_id), offer_id);
    env.storage()
        .persistent()
        .extend_ttl(key, OFFER_LIFETIME_THRESHOLD, OFFER_BUMP_AMOUNT);
}

/// Bump instance TTL on every contract call (called in initialization)
pub fn bump_instance(env: &Env) {
    extend_instance_ttl(env);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&ADMIN_KEY)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN_KEY, admin);
}

pub fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&ADMIN_KEY)
        .ok_or(Error::NotInitialized)
}

pub fn set_platform_fee(env: &Env, fee_bps: u32) {
    env.storage().instance().set(&PLATFORM_FEE_KEY, &fee_bps);
}

pub fn get_platform_fee(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&PLATFORM_FEE_KEY)
        .unwrap_or(0)
}

pub fn set_fee_recipient(env: &Env, recipient: &Address) {
    env.storage().instance().set(&FEE_RECIPIENT_KEY, recipient);
}

pub fn get_fee_recipient(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&FEE_RECIPIENT_KEY)
        .ok_or(Error::NotInitialized)
}

pub fn set_xlm_token_address(env: &Env, xlm_token: &Address) {
    env.storage().instance().set(&XLM_TOKEN_KEY, xlm_token);
}

pub fn get_xlm_token_address(env: &Env) -> Option<Address> {
    env.storage().instance().get(&XLM_TOKEN_KEY)
}

// ========== COUNTERS ==========

pub fn set_listing_counter(env: &Env, count: u64) {
    env.storage().instance().set(&LISTING_COUNTER_KEY, &count);
}

pub fn get_and_increment_listing_counter(env: &Env) -> u64 {
    let counter: u64 = env.storage()
        .instance()
        .get(&LISTING_COUNTER_KEY)
        .unwrap_or(0);

    env.storage().instance().set(&LISTING_COUNTER_KEY, &(counter + 1));

    counter
}

pub fn set_offer_counter(env: &Env, count: u64) {
    env.storage().instance().set(&OFFER_COUNTER_KEY, &count);
}

pub fn get_and_increment_offer_counter(env: &Env) -> u64 {
    let counter: u64 = env.storage()
        .instance()
        .get(&OFFER_COUNTER_KEY)
        .unwrap_or(0);

    env.storage().instance().set(&OFFER_COUNTER_KEY, &(counter + 1));

    counter
}

// ============================================================================
// LISTINGS (with TTL management)
// ============================================================================

/// Save listing and set appropriate TTL
pub fn save_listing(env: &Env, listing_id: u64, listing: &Listing) {
    let key = &(listing_key(listing_id), listing_id);

    // Save to persistent storage
    env.storage()
        .persistent()
        .set(key, listing);

    // Set TTL for listing (shorter than permanent data)
    extend_listing_ttl(env, listing_id);
}

/// Get listing and bump TTL on access
pub fn get_listing(env: &Env, listing_id: u64) -> Result<Listing, Error> {
    let listing = env.storage()
        .persistent()
        .get(&(listing_key(listing_id), listing_id))
        .ok_or(Error::ListingNotFound)?;

    // Bump TTL on access to keep active listings alive
    extend_listing_ttl(env, listing_id);

    Ok(listing)
}

/// Remove listing (no TTL management needed)
pub fn remove_listing(env: &Env, listing_id: u64) {
    env.storage()
        .persistent()
        .remove(&(listing_key(listing_id), listing_id));
}

pub fn add_active_listing(env: &Env, listing_id: u64) {
    let mut active: soroban_sdk::Vec<u64> = env.storage()
        .instance()
        .get(&active_listings_key())
        .unwrap_or(soroban_sdk::Vec::new(&env));

    active.push_back(listing_id);

    env.storage().instance().set(&active_listings_key(), &active);
}

pub fn remove_active_listing(env: &Env, listing_id: u64) {
    let active: Option<soroban_sdk::Vec<u64>> = env.storage()
        .instance()
        .get(&active_listings_key());

    if let Some(mut listings) = active {
        // Find and remove the listing_id
        let mut new_listings = soroban_sdk::Vec::new(&env);

        for i in 0..listings.len() {
            if let Some(id) = listings.get(i) {
                if id != listing_id {
                    new_listings.push_back(id);
                }
            }
        }

        env.storage().instance().set(&active_listings_key(), &new_listings);
    }
}

// ============================================================================
// OFFERS (with TTL management)
// ============================================================================

/// Save offer and set appropriate TTL (shorter than listings)
pub fn save_offer(env: &Env, offer_id: u64, offer: &Offer) {
    let key = &(offer_key(offer_id), offer_id);

    // Save to persistent storage
    env.storage()
        .persistent()
        .set(key, offer);

    // Set shorter TTL for offers (more ephemeral)
    extend_offer_ttl(env, offer_id);
}

/// Get offer and bump TTL on access
pub fn get_offer(env: &Env, offer_id: u64) -> Result<Offer, Error> {
    let offer = env.storage()
        .persistent()
        .get(&(offer_key(offer_id), offer_id))
        .ok_or(Error::OfferNotFound)?;

    // Bump TTL on access
    extend_offer_ttl(env, offer_id);

    Ok(offer)
}

/// Remove offer (no TTL management needed)
pub fn remove_offer(env: &Env, offer_id: u64) {
    env.storage()
        .persistent()
        .remove(&(offer_key(offer_id), offer_id));
}
