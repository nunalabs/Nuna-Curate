use soroban_sdk::{Address, Env, String, Vec};
use crate::{TokenMetadata, errors::Error};

// ============================================================================
// TTL CONFIGURATION (Time To Live for State Archival)
// ============================================================================
// NFT contracts contain permanent data (ownership) and semi-permanent data
// (metadata, royalties). All data is PERSISTENT but with different TTLs.
//
// TTL Strategy:
// - Ownership & Metadata: Very long TTL (permanent-ish)
// - Approvals: Shorter TTL (temporary permissions)
// - Collection Info: Very long TTL (rarely changes)
// ============================================================================

// NFT ownership & metadata - permanent data
const NFT_LIFETIME_THRESHOLD: u32 = 1_036_800;   // ~60 days
const NFT_BUMP_AMOUNT: u32 = 3_110_400;          // ~180 days

// Approvals - temporary permissions
const APPROVAL_LIFETIME_THRESHOLD: u32 = 172_800;  // ~10 days
const APPROVAL_BUMP_AMOUNT: u32 = 518_400;         // ~30 days

// Collection/Instance data - very permanent
const INSTANCE_LIFETIME_THRESHOLD: u32 = 2_073_600;  // ~120 days
const INSTANCE_BUMP_AMOUNT: u32 = 6_220_800;         // ~360 days (~1 year)

// Storage keys
const ADMIN_KEY: &str = "admin";
const NAME_KEY: &str = "name";
const SYMBOL_KEY: &str = "symbol";
const BASE_URI_KEY: &str = "base_uri";
const TOTAL_SUPPLY_KEY: &str = "total_supply";

// Dynamic keys helpers
fn token_owner_key(token_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("owner")
}

fn token_metadata_key(token_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("meta")
}

fn token_approval_key(token_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("appr")
}

fn operator_approval_key(owner: &Address, operator: &Address) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("op_appr")
}

fn balance_key(owner: &Address) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("balance")
}

fn owner_tokens_key(owner: &Address) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("own_toks")
}

fn token_index_key(token_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("tok_idx")
}

// ============================================================================
// TTL HELPER FUNCTIONS
// ============================================================================

/// Extend TTL for instance storage (collection info, admin)
fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

/// Extend TTL for NFT ownership and metadata
fn extend_nft_ttl(env: &Env, token_id: u64) {
    // Extend ownership
    env.storage()
        .persistent()
        .extend_ttl(
            &(token_owner_key(token_id), token_id),
            NFT_LIFETIME_THRESHOLD,
            NFT_BUMP_AMOUNT,
        );

    // Extend metadata
    env.storage()
        .persistent()
        .extend_ttl(
            &(token_metadata_key(token_id), token_id),
            NFT_LIFETIME_THRESHOLD,
            NFT_BUMP_AMOUNT,
        );
}

/// Extend TTL for approval (shorter lifetime)
fn extend_approval_ttl(env: &Env, token_id: u64) {
    env.storage()
        .persistent()
        .extend_ttl(
            &(token_approval_key(token_id), token_id),
            APPROVAL_LIFETIME_THRESHOLD,
            APPROVAL_BUMP_AMOUNT,
        );
}

/// Extend TTL for owner enumeration data
fn extend_enumeration_ttl(env: &Env, owner: &Address) {
    env.storage()
        .persistent()
        .extend_ttl(
            &(owner_tokens_key(owner), owner),
            NFT_LIFETIME_THRESHOLD,
            NFT_BUMP_AMOUNT,
        );
}

/// Bump instance TTL (called on every contract interaction)
pub fn bump_instance(env: &Env) {
    extend_instance_ttl(env);
}

// ============================================================================
// ADMIN
// ============================================================================

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN_KEY, admin);
}

pub fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&ADMIN_KEY)
        .ok_or(Error::NotInitialized)
}

// ========== COLLECTION INFO ==========

pub fn set_collection_info(env: &Env, name: &String, symbol: &String, base_uri: &String) {
    env.storage().instance().set(&NAME_KEY, name);
    env.storage().instance().set(&SYMBOL_KEY, symbol);
    env.storage().instance().set(&BASE_URI_KEY, base_uri);
}

pub fn has_collection_info(env: &Env) -> bool {
    env.storage().instance().has(&NAME_KEY)
}

pub fn get_collection_name(env: &Env) -> Result<String, Error> {
    env.storage()
        .instance()
        .get(&NAME_KEY)
        .ok_or(Error::NotInitialized)
}

pub fn get_collection_symbol(env: &Env) -> Result<String, Error> {
    env.storage()
        .instance()
        .get(&SYMBOL_KEY)
        .ok_or(Error::NotInitialized)
}

pub fn get_base_uri(env: &Env) -> Result<String, Error> {
    env.storage()
        .instance()
        .get(&BASE_URI_KEY)
        .ok_or(Error::NotInitialized)
}

pub fn update_base_uri(env: &Env, base_uri: &String) {
    env.storage().instance().set(&BASE_URI_KEY, base_uri);
}

// ========== SUPPLY ==========

pub fn set_total_supply(env: &Env, supply: u64) {
    env.storage().instance().set(&TOTAL_SUPPLY_KEY, &supply);
}

pub fn get_total_supply(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&TOTAL_SUPPLY_KEY)
        .unwrap_or(0)
}

// ========== TOKENS ==========

pub fn token_exists(env: &Env, token_id: u64) -> bool {
    env.storage()
        .persistent()
        .has(&(token_owner_key(token_id), token_id))
}

/// Set token owner and extend TTL
pub fn set_token_owner(env: &Env, token_id: u64, owner: &Address) {
    env.storage()
        .persistent()
        .set(&(token_owner_key(token_id), token_id), owner);

    // Extend TTL for permanent NFT data
    extend_nft_ttl(env, token_id);
}

/// Get token owner and bump TTL on access
pub fn get_token_owner(env: &Env, token_id: u64) -> Result<Address, Error> {
    let owner = env.storage()
        .persistent()
        .get(&(token_owner_key(token_id), token_id))
        .ok_or(Error::TokenNotFound)?;

    // Bump TTL on access to keep active NFTs alive
    extend_nft_ttl(env, token_id);

    Ok(owner)
}

/// Set token metadata and extend TTL
pub fn set_token_metadata(env: &Env, token_id: u64, metadata: &TokenMetadata) {
    env.storage()
        .persistent()
        .set(&(token_metadata_key(token_id), token_id), metadata);

    // Extend TTL for metadata
    extend_nft_ttl(env, token_id);
}

/// Get token metadata and bump TTL on access
pub fn get_token_metadata(env: &Env, token_id: u64) -> Result<TokenMetadata, Error> {
    let metadata = env.storage()
        .persistent()
        .get(&(token_metadata_key(token_id), token_id))
        .ok_or(Error::MetadataNotFound)?;

    // Bump TTL on access
    extend_nft_ttl(env, token_id);

    Ok(metadata)
}

pub fn remove_token(env: &Env, token_id: u64, owner: &Address) -> Result<(), Error> {
    // Remove from enumeration first
    remove_token_from_owner_enumeration(env, owner, token_id);

    // Remove owner
    env.storage()
        .persistent()
        .remove(&(token_owner_key(token_id), token_id));

    // Remove metadata
    env.storage()
        .persistent()
        .remove(&(token_metadata_key(token_id), token_id));

    // Remove approval
    env.storage()
        .persistent()
        .remove(&(token_approval_key(token_id), token_id));

    // Update balance
    let balance = get_balance(env, owner);
    if balance > 0 {
        set_balance(env, owner, balance - 1);
    }

    Ok(())
}

// ========== APPROVALS ==========

pub fn set_token_approval(env: &Env, token_id: u64, approved: &Address) {
    env.storage()
        .persistent()
        .set(&(token_approval_key(token_id), token_id), approved);
}

pub fn get_token_approval(env: &Env, token_id: u64) -> Option<Address> {
    env.storage()
        .persistent()
        .get(&(token_approval_key(token_id), token_id))
}

pub fn clear_token_approval(env: &Env, token_id: u64) {
    env.storage()
        .persistent()
        .remove(&(token_approval_key(token_id), token_id));
}

pub fn set_operator_approval(env: &Env, owner: &Address, operator: &Address, approved: bool) {
    if approved {
        env.storage()
            .persistent()
            .set(&(operator_approval_key(owner, operator), owner, operator), &true);
    } else {
        env.storage()
            .persistent()
            .remove(&(operator_approval_key(owner, operator), owner, operator));
    }
}

pub fn is_approved_for_all(env: &Env, owner: &Address, operator: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&(operator_approval_key(owner, operator), owner, operator))
        .unwrap_or(false)
}

// ========== BALANCES ==========

pub fn set_balance(env: &Env, owner: &Address, balance: u64) {
    env.storage()
        .persistent()
        .set(&(balance_key(owner), owner), &balance);
}

pub fn get_balance(env: &Env, owner: &Address) -> u64 {
    env.storage()
        .persistent()
        .get(&(balance_key(owner), owner))
        .unwrap_or(0)
}

// ========== ROYALTIES (ERC-2981) ==========

fn default_royalty_key() -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("def_roy")
}

fn token_royalty_key(token_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("tok_roy")
}

/// Set default royalty for entire collection
/// Stores (receiver, bps) tuple
pub fn set_default_royalty_info(env: &Env, receiver: &Address, bps: u32) {
    env.storage()
        .instance()
        .set(&default_royalty_key(), &(receiver.clone(), bps));
}

/// Get default royalty info
/// Returns Option<(receiver, bps)>
pub fn get_default_royalty_info(env: &Env) -> Option<(Address, u32)> {
    env.storage()
        .instance()
        .get(&default_royalty_key())
}

/// Delete default royalty
pub fn delete_default_royalty_info(env: &Env) {
    env.storage()
        .instance()
        .remove(&default_royalty_key());
}

/// Set token-specific royalty (overrides default)
pub fn set_token_royalty_info(env: &Env, token_id: u64, receiver: &Address, bps: u32) {
    env.storage()
        .persistent()
        .set(&(token_royalty_key(token_id), token_id), &(receiver.clone(), bps));
}

/// Get token-specific royalty
/// Returns Option<(receiver, bps)>
pub fn get_token_royalty_info(env: &Env, token_id: u64) -> Option<(Address, u32)> {
    env.storage()
        .persistent()
        .get(&(token_royalty_key(token_id), token_id))
}

/// Delete token-specific royalty
pub fn delete_token_royalty_info(env: &Env, token_id: u64) {
    env.storage()
        .persistent()
        .remove(&(token_royalty_key(token_id), token_id));
}

// ========== ENUMERABLE (ERC-721 Enumerable Extension) ==========

/// Add token to owner's token list
/// Called when minting or transferring to a new owner
pub fn add_token_to_owner_enumeration(env: &Env, owner: &Address, token_id: u64) {
    let mut tokens = get_owner_tokens(env, owner);

    // Store the index where this token will be added
    let index = tokens.len();
    env.storage()
        .persistent()
        .set(&(token_index_key(token_id), token_id), &index);

    // Add token to owner's list
    tokens.push_back(token_id);
    env.storage()
        .persistent()
        .set(&(owner_tokens_key(owner), owner), &tokens);
}

/// Remove token from owner's token list
/// Called when burning or transferring away
pub fn remove_token_from_owner_enumeration(env: &Env, owner: &Address, token_id: u64) {
    let mut tokens = get_owner_tokens(env, owner);

    // Get the index of this token
    let token_index_opt: Option<u32> = env.storage()
        .persistent()
        .get(&(token_index_key(token_id), token_id));

    if let Some(token_index) = token_index_opt {
        let last_token_index = tokens.len() - 1;

        if token_index != last_token_index {
            // Move the last token to the position of the token being removed
            let last_token_id = tokens.get(last_token_index).unwrap();
            tokens.set(token_index, last_token_id);

            // Update the index of the moved token
            env.storage()
                .persistent()
                .set(&(token_index_key(last_token_id), last_token_id), &token_index);
        }

        // Remove the last element
        tokens.pop_back();

        // Remove the token's index
        env.storage()
            .persistent()
            .remove(&(token_index_key(token_id), token_id));

        // Save updated token list
        env.storage()
            .persistent()
            .set(&(owner_tokens_key(owner), owner), &tokens);
    }
}

/// Get all token IDs owned by an address
pub fn get_owner_tokens(env: &Env, owner: &Address) -> Vec<u64> {
    env.storage()
        .persistent()
        .get(&(owner_tokens_key(owner), owner))
        .unwrap_or(Vec::new(env))
}
