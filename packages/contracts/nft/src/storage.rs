use soroban_sdk::{Address, Env, String};
use crate::{TokenMetadata, errors::Error};

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

// ========== ADMIN ==========

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

pub fn set_token_owner(env: &Env, token_id: u64, owner: &Address) {
    env.storage()
        .persistent()
        .set(&(token_owner_key(token_id), token_id), owner);
}

pub fn get_token_owner(env: &Env, token_id: u64) -> Result<Address, Error> {
    env.storage()
        .persistent()
        .get(&(token_owner_key(token_id), token_id))
        .ok_or(Error::TokenNotFound)
}

pub fn set_token_metadata(env: &Env, token_id: u64, metadata: &TokenMetadata) {
    env.storage()
        .persistent()
        .set(&(token_metadata_key(token_id), token_id), metadata);
}

pub fn get_token_metadata(env: &Env, token_id: u64) -> Result<TokenMetadata, Error> {
    env.storage()
        .persistent()
        .get(&(token_metadata_key(token_id), token_id))
        .ok_or(Error::MetadataNotFound)
}

pub fn remove_token(env: &Env, token_id: u64, owner: &Address) -> Result<(), Error> {
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
