#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn create_nft_contract<'a>(env: &Env) -> NFTContractClient<'a> {
    NFTContractClient::new(env, &env.register_contract(None, NFTContract {}))
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);

    let name = String::from_str(&env, "Test Collection");
    let symbol = String::from_str(&env, "TEST");
    let base_uri = String::from_str(&env, "ipfs://");

    contract.initialize(&admin, &name, &symbol, &base_uri);

    assert_eq!(contract.name(), name);
    assert_eq!(contract.symbol(), symbol);
    assert_eq!(contract.base_uri(), base_uri);
    assert_eq!(contract.total_supply(), 0);
}

#[test]
fn test_mint() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    // Initialize
    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    // Mint
    let metadata = TokenMetadata {
        name: String::from_str(&env, "Token #1"),
        description: String::from_str(&env, "Test token"),
        image_uri: String::from_str(&env, "ipfs://image"),
        metadata_uri: String::from_str(&env, "ipfs://metadata"),
    };

    contract.mint(&user, &1, &metadata);

    assert_eq!(contract.owner_of(&1), user);
    assert_eq!(contract.balance_of(&user), 1);
    assert_eq!(contract.total_supply(), 1);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);

    // Initialize and mint
    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    let metadata = TokenMetadata {
        name: String::from_str(&env, "Token #1"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://image"),
        metadata_uri: String::from_str(&env, "ipfs://metadata"),
    };

    contract.mint(&from, &1, &metadata);

    // Transfer
    contract.transfer(&from, &to, &1);

    assert_eq!(contract.owner_of(&1), to);
    assert_eq!(contract.balance_of(&from), 0);
    assert_eq!(contract.balance_of(&to), 1);
}

#[test]
fn test_approve_and_transfer_from() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let approved = Address::generate(&env);
    let to = Address::generate(&env);

    // Setup
    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    let metadata = TokenMetadata {
        name: String::from_str(&env, "Token #1"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://image"),
        metadata_uri: String::from_str(&env, "ipfs://metadata"),
    };

    contract.mint(&owner, &1, &metadata);

    // Approve
    contract.approve(&owner, &approved, &1);
    assert_eq!(contract.get_approved(&1), Some(approved.clone()));

    // Transfer from
    contract.transfer_from(&approved, &owner, &to, &1);
    assert_eq!(contract.owner_of(&1), to);
    assert_eq!(contract.get_approved(&1), None);
}

#[test]
#[should_panic(expected = "TokenAlreadyExists")]
fn test_mint_duplicate_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    let metadata = TokenMetadata {
        name: String::from_str(&env, "Token #1"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://image"),
        metadata_uri: String::from_str(&env, "ipfs://metadata"),
    };

    contract.mint(&user, &1, &metadata);
    contract.mint(&user, &1, &metadata); // Should fail
}
