#![no_std]

//! Nuna Curate NFT Contract
//!
//! Production-ready ERC-721 equivalent NFT contract for Stellar Soroban.
//! Supports minting, transfers, approvals, and metadata management.

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Vec,
};

mod storage;
mod events;
mod metadata;
mod errors;

use storage::*;
use events::*;
use errors::Error;

#[contract]
pub struct NFTContract;

#[contracttype]
#[derive(Clone)]
pub struct TokenMetadata {
    pub name: String,
    pub description: String,
    pub image_uri: String,
    pub metadata_uri: String,
}

#[contractimpl]
impl NFTContract {
    /// Initialize the NFT collection
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        base_uri: String,
    ) -> Result<(), Error> {
        if has_collection_info(&env) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        set_admin(&env, &admin);
        set_collection_info(&env, &name, &symbol, &base_uri);
        set_total_supply(&env, 0);

        events::emit_collection_created(&env, &name, &symbol, &admin);

        Ok(())
    }

    /// Mint a new NFT token
    pub fn mint(
        env: Env,
        to: Address,
        token_id: u64,
        metadata: TokenMetadata,
    ) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        admin.require_auth();

        // Check if token already exists
        if token_exists(&env, token_id) {
            return Err(Error::TokenAlreadyExists);
        }

        // Set token owner
        set_token_owner(&env, token_id, &to);

        // Set token metadata
        set_token_metadata(&env, token_id, &metadata);

        // Increment total supply
        let total_supply = get_total_supply(&env);
        set_total_supply(&env, total_supply + 1);

        // Update owner's balance
        let balance = get_balance(&env, &to);
        set_balance(&env, &to, balance + 1);

        events::emit_mint(&env, &to, token_id, &metadata.metadata_uri);

        Ok(())
    }

    /// Transfer NFT from one address to another
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        // Verify ownership
        let owner = get_token_owner(&env, token_id)?;
        if owner != from {
            return Err(Error::Unauthorized);
        }

        from.require_auth();

        // Execute transfer
        transfer_token(&env, &from, &to, token_id)?;

        events::emit_transfer(&env, &from, &to, token_id);

        Ok(())
    }

    /// Transfer NFT with approval
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        spender.require_auth();

        // Verify ownership
        let owner = get_token_owner(&env, token_id)?;
        if owner != from {
            return Err(Error::Unauthorized);
        }

        // Check approval
        let approved = get_token_approval(&env, token_id);
        let is_operator = is_approved_for_all(&env, &from, &spender);

        if approved != Some(spender.clone()) && !is_operator {
            return Err(Error::NotApproved);
        }

        // Clear approval
        clear_token_approval(&env, token_id);

        // Execute transfer
        transfer_token(&env, &from, &to, token_id)?;

        events::emit_transfer(&env, &from, &to, token_id);

        Ok(())
    }

    /// Approve an address to transfer a specific token
    pub fn approve(
        env: Env,
        owner: Address,
        to: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        owner.require_auth();

        // Verify ownership
        let token_owner = get_token_owner(&env, token_id)?;
        if token_owner != owner {
            return Err(Error::Unauthorized);
        }

        set_token_approval(&env, token_id, &to);

        events::emit_approval(&env, &owner, &to, token_id);

        Ok(())
    }

    /// Set approval for all tokens
    pub fn set_approval_for_all(
        env: Env,
        owner: Address,
        operator: Address,
        approved: bool,
    ) -> Result<(), Error> {
        owner.require_auth();

        set_operator_approval(&env, &owner, &operator, approved);

        events::emit_approval_for_all(&env, &owner, &operator, approved);

        Ok(())
    }

    /// Burn (destroy) an NFT token
    pub fn burn(
        env: Env,
        owner: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        owner.require_auth();

        // Verify ownership
        let token_owner = get_token_owner(&env, token_id)?;
        if token_owner != owner {
            return Err(Error::Unauthorized);
        }

        // Remove token
        remove_token(&env, token_id, &owner)?;

        // Update total supply
        let total_supply = get_total_supply(&env);
        set_total_supply(&env, total_supply - 1);

        events::emit_burn(&env, &owner, token_id);

        Ok(())
    }

    // ========== VIEW FUNCTIONS ==========

    /// Get token owner
    pub fn owner_of(env: Env, token_id: u64) -> Result<Address, Error> {
        get_token_owner(&env, token_id)
    }

    /// Get token metadata
    pub fn token_metadata(env: Env, token_id: u64) -> Result<TokenMetadata, Error> {
        get_token_metadata(&env, token_id)
    }

    /// Get token URI
    pub fn token_uri(env: Env, token_id: u64) -> Result<String, Error> {
        let metadata = get_token_metadata(&env, token_id)?;
        Ok(metadata.metadata_uri)
    }

    /// Get approved address for token
    pub fn get_approved(env: Env, token_id: u64) -> Option<Address> {
        get_token_approval(&env, token_id)
    }

    /// Check if operator is approved for all owner's tokens
    pub fn is_approved_for_all(
        env: Env,
        owner: Address,
        operator: Address,
    ) -> bool {
        is_approved_for_all(&env, &owner, &operator)
    }

    /// Get owner's NFT balance
    pub fn balance_of(env: Env, owner: Address) -> u64 {
        get_balance(&env, &owner)
    }

    /// Get collection name
    pub fn name(env: Env) -> Result<String, Error> {
        get_collection_name(&env)
    }

    /// Get collection symbol
    pub fn symbol(env: Env) -> Result<String, Error> {
        get_collection_symbol(&env)
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> u64 {
        get_total_supply(&env)
    }

    /// Get base URI
    pub fn base_uri(env: Env) -> Result<String, Error> {
        get_base_uri(&env)
    }

    /// Get contract admin
    pub fn admin(env: Env) -> Result<Address, Error> {
        get_admin(&env)
    }

    /// Check if token exists
    pub fn exists(env: Env, token_id: u64) -> bool {
        token_exists(&env, token_id)
    }

    // ========== ADMIN FUNCTIONS ==========

    /// Update base URI (admin only)
    pub fn set_base_uri(
        env: Env,
        admin: Address,
        new_base_uri: String,
    ) -> Result<(), Error> {
        let current_admin = get_admin(&env)?;
        if current_admin != admin {
            return Err(Error::Unauthorized);
        }

        admin.require_auth();

        update_base_uri(&env, &new_base_uri);

        Ok(())
    }

    /// Transfer admin role
    pub fn transfer_admin(
        env: Env,
        current_admin: Address,
        new_admin: Address,
    ) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        if admin != current_admin {
            return Err(Error::Unauthorized);
        }

        current_admin.require_auth();

        set_admin(&env, &new_admin);

        Ok(())
    }
}

/// Internal transfer helper
fn transfer_token(
    env: &Env,
    from: &Address,
    to: &Address,
    token_id: u64,
) -> Result<(), Error> {
    // Update owner
    set_token_owner(env, token_id, to);

    // Update balances
    let from_balance = get_balance(env, from);
    set_balance(env, from, from_balance - 1);

    let to_balance = get_balance(env, to);
    set_balance(env, to, to_balance + 1);

    Ok(())
}

#[cfg(test)]
mod test;
