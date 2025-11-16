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

// ========== ADDITIONAL COMPREHENSIVE TESTS ==========

#[test]
fn test_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

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
    assert_eq!(contract.balance_of(&owner), 1);
    assert_eq!(contract.total_supply(), 1);

    // Burn
    contract.burn(&owner, &1);

    assert_eq!(contract.balance_of(&owner), 0);
    assert_eq!(contract.total_supply(), 0);
    assert_eq!(contract.exists(&1), false);
}

#[test]
fn test_set_approval_for_all() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let operator = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    // Set approval for all
    contract.set_approval_for_all(&owner, &operator, &true);
    assert_eq!(contract.is_approved_for_all(&owner, &operator), true);

    // Revoke
    contract.set_approval_for_all(&owner, &operator, &false);
    assert_eq!(contract.is_approved_for_all(&owner, &operator), false);
}

#[test]
fn test_royalty_default() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let receiver = Address::generate(&env);
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

    // Set 5% royalty (500 basis points)
    contract.set_default_royalty(&admin, &receiver, &500);

    // Calculate royalty for 1000 XLM sale
    let (royalty_receiver, royalty_amount) = contract.royalty_info(&1, &1000);

    assert_eq!(royalty_receiver, receiver);
    assert_eq!(royalty_amount, 50); // 5% of 1000
}

#[test]
fn test_royalty_token_specific() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let default_receiver = Address::generate(&env);
    let special_receiver = Address::generate(&env);
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

    contract.mint(&user, &1, &metadata.clone());
    contract.mint(&user, &2, &metadata);

    // Set default 5% royalty
    contract.set_default_royalty(&admin, &default_receiver, &500);

    // Set token-specific 10% royalty for token 1
    contract.set_token_royalty(&admin, &1, &special_receiver, &1000);

    // Token 1 uses special royalty
    let (receiver1, amount1) = contract.royalty_info(&1, &1000);
    assert_eq!(receiver1, special_receiver);
    assert_eq!(amount1, 100);

    // Token 2 uses default royalty
    let (receiver2, amount2) = contract.royalty_info(&2, &1000);
    assert_eq!(receiver2, default_receiver);
    assert_eq!(amount2, 50);
}

#[test]
#[should_panic(expected = "InvalidRoyalty")]
fn test_royalty_max_validation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let receiver = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    // Try to set 15% royalty (should fail, max is 10%)
    contract.set_default_royalty(&admin, &receiver, &1500);
}

#[test]
fn test_multiple_mints_balances() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    let metadata = TokenMetadata {
        name: String::from_str(&env, "Token"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://image"),
        metadata_uri: String::from_str(&env, "ipfs://metadata"),
    };

    // Mint 3 to user1
    for i in 1..=3 {
        contract.mint(&user1, &i, &metadata.clone());
    }

    // Mint 2 to user2
    for i in 4..=5 {
        contract.mint(&user2, &i, &metadata.clone());
    }

    assert_eq!(contract.balance_of(&user1), 3);
    assert_eq!(contract.balance_of(&user2), 2);
    assert_eq!(contract.total_supply(), 5);
}

#[test]
fn test_transfer_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);

    contract.initialize(
        &admin1,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    assert_eq!(contract.admin(), Ok(admin1.clone()));

    contract.transfer_admin(&admin1, &admin2);

    assert_eq!(contract.admin(), Ok(admin2));
}

#[test]
fn test_set_base_uri() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://old/"),
    );

    let new_uri = String::from_str(&env, "ipfs://new/");
    contract.set_base_uri(&admin, &new_uri);

    assert_eq!(contract.base_uri(), Ok(new_uri));
}

#[test]
fn test_approval_cleared_after_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let approved = Address::generate(&env);
    let to = Address::generate(&env);

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
    contract.approve(&owner, &approved, &1);

    assert_eq!(contract.get_approved(&1), Some(approved.clone()));

    // Transfer clears approval
    contract.transfer(&owner, &to, &1);

    assert_eq!(contract.get_approved(&1), None);
}

// ========== BATCH MINTING TESTS ==========

#[test]
fn test_batch_mint_success() {
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

    // Prepare batch data
    let mut token_ids = Vec::new(&env);
    let mut metadata_list = Vec::new(&env);

    for i in 1..=5 {
        token_ids.push_back(i);
        metadata_list.push_back(TokenMetadata {
            name: String::from_str(&env, &format!("Token #{}", i)),
            description: String::from_str(&env, "Test token"),
            image_uri: String::from_str(&env, &format!("ipfs://image{}", i)),
            metadata_uri: String::from_str(&env, &format!("ipfs://metadata{}", i)),
        });
    }

    // Batch mint
    let minted_ids = contract.batch_mint(&user, &token_ids, &metadata_list);
    assert_eq!(minted_ids.unwrap().len(), 5);

    // Verify all tokens were minted
    assert_eq!(contract.balance_of(&user), 5);
    assert_eq!(contract.total_supply(), 5);

    // Verify individual tokens
    for i in 1..=5 {
        assert_eq!(contract.owner_of(&i), Ok(user.clone()));
        assert!(contract.exists(&i));
    }
}

#[test]
fn test_batch_mint_gas_optimization() {
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

    // Create batch of 10 NFTs
    let mut token_ids = Vec::new(&env);
    let mut metadata_list = Vec::new(&env);

    for i in 1..=10 {
        token_ids.push_back(i);
        metadata_list.push_back(TokenMetadata {
            name: String::from_str(&env, "Batch NFT"),
            description: String::from_str(&env, "Optimized"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    // Batch mint - storage updates happen once at the end
    contract.batch_mint(&user, &token_ids, &metadata_list);

    assert_eq!(contract.balance_of(&user), 10);
    assert_eq!(contract.total_supply(), 10);
}

#[test]
#[should_panic(expected = "BatchEmpty")]
fn test_batch_mint_empty_fails() {
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

    let token_ids = Vec::new(&env);
    let metadata_list = Vec::new(&env);

    contract.batch_mint(&user, &token_ids, &metadata_list); // Should fail
}

#[test]
#[should_panic(expected = "BatchTooLarge")]
fn test_batch_mint_too_large_fails() {
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

    // Create batch of 101 NFTs (over limit)
    let mut token_ids = Vec::new(&env);
    let mut metadata_list = Vec::new(&env);

    for i in 1..=101 {
        token_ids.push_back(i);
        metadata_list.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user, &token_ids, &metadata_list); // Should fail
}

#[test]
#[should_panic(expected = "InvalidBatchSize")]
fn test_batch_mint_mismatched_arrays_fails() {
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

    // 5 token IDs but only 3 metadata items
    let mut token_ids = Vec::new(&env);
    for i in 1..=5 {
        token_ids.push_back(i);
    }

    let mut metadata_list = Vec::new(&env);
    for _ in 1..=3 {
        metadata_list.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user, &token_ids, &metadata_list); // Should fail
}

#[test]
#[should_panic(expected = "TokenAlreadyExists")]
fn test_batch_mint_duplicate_in_batch_fails() {
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

    // First batch mint
    let mut token_ids = Vec::new(&env);
    let mut metadata_list = Vec::new(&env);

    for i in 1..=3 {
        token_ids.push_back(i);
        metadata_list.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user, &token_ids, &metadata_list);

    // Try to mint again with overlapping IDs
    let mut token_ids2 = Vec::new(&env);
    let mut metadata_list2 = Vec::new(&env);

    for i in 2..=4 {
        token_ids2.push_back(i);
        metadata_list2.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user, &token_ids2, &metadata_list2); // Should fail at token 2
}

#[test]
fn test_batch_mint_multiple_users() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    // Batch mint for user1
    let mut token_ids1 = Vec::new(&env);
    let mut metadata_list1 = Vec::new(&env);

    for i in 1..=3 {
        token_ids1.push_back(i);
        metadata_list1.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user1, &token_ids1, &metadata_list1);

    // Batch mint for user2
    let mut token_ids2 = Vec::new(&env);
    let mut metadata_list2 = Vec::new(&env);

    for i in 4..=6 {
        token_ids2.push_back(i);
        metadata_list2.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user2, &token_ids2, &metadata_list2);

    // Verify balances
    assert_eq!(contract.balance_of(&user1), 3);
    assert_eq!(contract.balance_of(&user2), 3);
    assert_eq!(contract.total_supply(), 6);
}

// ========== ENUMERABLE TESTS ==========

#[test]
fn test_tokens_of_owner() {
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
        name: String::from_str(&env, "Token"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://img"),
        metadata_uri: String::from_str(&env, "ipfs://meta"),
    };

    // Mint 3 tokens
    contract.mint(&user, &1, &metadata.clone());
    contract.mint(&user, &5, &metadata.clone());
    contract.mint(&user, &10, &metadata.clone());

    // Get tokens
    let tokens = contract.tokens_of_owner(&user);

    assert_eq!(tokens.len(), 3);
    assert_eq!(tokens.get(0).unwrap(), 1);
    assert_eq!(tokens.get(1).unwrap(), 5);
    assert_eq!(tokens.get(2).unwrap(), 10);
}

#[test]
fn test_tokens_of_owner_paginated() {
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
        name: String::from_str(&env, "Token"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://img"),
        metadata_uri: String::from_str(&env, "ipfs://meta"),
    };

    // Mint 10 tokens
    for i in 1..=10 {
        contract.mint(&user, &i, &metadata.clone());
    }

    // Get first 5
    let (page1, total) = contract.tokens_of_owner_paginated(&user, &0, &5);
    assert_eq!(page1.len(), 5);
    assert_eq!(total, 10);
    assert_eq!(page1.get(0).unwrap(), 1);
    assert_eq!(page1.get(4).unwrap(), 5);

    // Get next 5
    let (page2, _) = contract.tokens_of_owner_paginated(&user, &5, &5);
    assert_eq!(page2.len(), 5);
    assert_eq!(page2.get(0).unwrap(), 6);
    assert_eq!(page2.get(4).unwrap(), 10);

    // Get with offset beyond total
    let (page3, _) = contract.tokens_of_owner_paginated(&user, &20, &5);
    assert_eq!(page3.len(), 0);
}

#[test]
fn test_token_of_owner_by_index() {
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
        name: String::from_str(&env, "Token"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://img"),
        metadata_uri: String::from_str(&env, "ipfs://meta"),
    };

    contract.mint(&user, &100, &metadata.clone());
    contract.mint(&user, &200, &metadata.clone());
    contract.mint(&user, &300, &metadata.clone());

    assert_eq!(contract.token_of_owner_by_index(&user, &0), Ok(100));
    assert_eq!(contract.token_of_owner_by_index(&user, &1), Ok(200));
    assert_eq!(contract.token_of_owner_by_index(&user, &2), Ok(300));
}

#[test]
fn test_enumerable_after_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_nft_contract(&env);
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    contract.initialize(
        &admin,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "TEST"),
        &String::from_str(&env, "ipfs://"),
    );

    let metadata = TokenMetadata {
        name: String::from_str(&env, "Token"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://img"),
        metadata_uri: String::from_str(&env, "ipfs://meta"),
    };

    // Mint to user1
    contract.mint(&user1, &1, &metadata.clone());
    contract.mint(&user1, &2, &metadata.clone());
    contract.mint(&user1, &3, &metadata.clone());

    assert_eq!(contract.tokens_of_owner(&user1).len(), 3);
    assert_eq!(contract.tokens_of_owner(&user2).len(), 0);

    // Transfer token 2 to user2
    contract.transfer(&user1, &user2, &2);

    // Verify enumeration updated
    let user1_tokens = contract.tokens_of_owner(&user1);
    let user2_tokens = contract.tokens_of_owner(&user2);

    assert_eq!(user1_tokens.len(), 2);
    assert_eq!(user2_tokens.len(), 1);
    assert_eq!(user2_tokens.get(0).unwrap(), 2);
}

#[test]
fn test_enumerable_after_burn() {
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
        name: String::from_str(&env, "Token"),
        description: String::from_str(&env, "Test"),
        image_uri: String::from_str(&env, "ipfs://img"),
        metadata_uri: String::from_str(&env, "ipfs://meta"),
    };

    // Mint 5 tokens
    for i in 1..=5 {
        contract.mint(&user, &i, &metadata.clone());
    }

    assert_eq!(contract.tokens_of_owner(&user).len(), 5);

    // Burn token 3 (middle of list)
    contract.burn(&user, &3);

    // Verify enumeration updated
    let tokens = contract.tokens_of_owner(&user);
    assert_eq!(tokens.len(), 4);

    // Verify token 3 is not in the list
    for i in 0..tokens.len() {
        assert_ne!(tokens.get(i).unwrap(), 3);
    }
}

#[test]
fn test_enumerable_batch_mint() {
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

    // Batch mint 10 tokens
    let mut token_ids = Vec::new(&env);
    let mut metadata_list = Vec::new(&env);

    for i in 1..=10 {
        token_ids.push_back(i);
        metadata_list.push_back(TokenMetadata {
            name: String::from_str(&env, "Token"),
            description: String::from_str(&env, "Test"),
            image_uri: String::from_str(&env, "ipfs://img"),
            metadata_uri: String::from_str(&env, "ipfs://meta"),
        });
    }

    contract.batch_mint(&user, &token_ids, &metadata_list);

    // Verify enumeration is correct
    let tokens = contract.tokens_of_owner(&user);
    assert_eq!(tokens.len(), 10);

    for i in 0..10 {
        assert_eq!(tokens.get(i).unwrap(), (i + 1) as u64);
    }
}
