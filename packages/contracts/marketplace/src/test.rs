#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn create_marketplace_contract<'a>(env: &Env) -> MarketplaceContractClient<'a> {
    MarketplaceContractClient::new(env, &env.register_contract(None, MarketplaceContract {}))
}

// Helper to initialize marketplace for tests
fn setup_marketplace(env: &Env) -> (MarketplaceContractClient, Address, Address, Address) {
    let contract = create_marketplace_contract(env);
    let admin = Address::generate(env);
    let fee_recipient = Address::generate(env);
    let xlm_token = Address::generate(env); // Mock XLM token address
    let fee_bps = 250; // 2.5%

    contract.initialize(&admin, &fee_bps, &fee_recipient, &xlm_token);

    (contract, admin, fee_recipient, xlm_token)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let xlm_token = Address::generate(&env);
    let fee_bps = 250; // 2.5%

    contract.initialize(&admin, &fee_bps, &fee_recipient, &xlm_token);

    assert_eq!(contract.get_platform_fee(), fee_bps);
    assert_eq!(contract.get_admin(), Ok(admin));
}

#[test]
fn test_create_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000, // 100 XLM
        &None,
    );

    assert_eq!(listing_id, Ok(0));

    let listing = contract.get_listing(&listing_id.unwrap());
    assert_eq!(listing.unwrap().seller, seller);
    assert_eq!(listing.unwrap().price, 100_0000000);
    assert_eq!(listing.unwrap().status, ListingStatus::Active);
}

#[test]
fn test_cancel_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000,
        &None,
    ).unwrap();

    contract.cancel_listing(&listing_id, &seller);

    let listing = contract.get_listing(&listing_id).unwrap();
    assert_eq!(listing.status, ListingStatus::Cancelled);
}

#[test]
fn test_make_offer() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let offer_id = contract.make_offer(
        &nft_contract,
        &1,
        &buyer,
        &50_0000000, // 50 XLM
        &None,
    ).unwrap();

    assert_eq!(offer_id, 0);

    let offer = contract.get_offer(&offer_id).unwrap();
    assert_eq!(offer.buyer, buyer);
    assert_eq!(offer.amount, 50_0000000);
}

#[test]
#[should_panic(expected = "InvalidPrice")]
fn test_create_listing_invalid_price() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Should fail with invalid price
    contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &0, // Invalid: zero price
        &None,
    );
}

#[test]
#[should_panic(expected = "InvalidFee")]
fn test_initialize_invalid_fee() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let xlm_token = Address::generate(&env);

    // Should fail: fee > 10%
    contract.initialize(&admin, &1100, &fee_recipient, &xlm_token);
}

// ========== COMPREHENSIVE MARKETPLACE TESTS ==========

#[test]
#[should_panic(expected = "AlreadyInitialized")]
fn test_initialize_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let xlm_token = Address::generate(&env);

    contract.initialize(&admin, &250, &fee_recipient, &xlm_token);
    contract.initialize(&admin, &250, &fee_recipient, &xlm_token); // Should fail
}

#[test]
fn test_create_multiple_listings() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Create 3 listings
    let listing_id_1 = contract.create_listing(&nft_contract, &1, &seller, &100_0000000, &None).unwrap();
    let listing_id_2 = contract.create_listing(&nft_contract, &2, &seller, &200_0000000, &None).unwrap();
    let listing_id_3 = contract.create_listing(&nft_contract, &3, &seller, &300_0000000, &None).unwrap();

    assert_eq!(listing_id_1, 0);
    assert_eq!(listing_id_2, 1);
    assert_eq!(listing_id_3, 2);

    // Verify all listings
    let listing1 = contract.get_listing(&listing_id_1).unwrap();
    let listing2 = contract.get_listing(&listing_id_2).unwrap();
    let listing3 = contract.get_listing(&listing_id_3).unwrap();

    assert_eq!(listing1.price, 100_0000000);
    assert_eq!(listing2.price, 200_0000000);
    assert_eq!(listing3.price, 300_0000000);
}

#[test]
fn test_listing_with_expiry() {
    let env = Env::default();
    env.mock_all_auths();

    // Set ledger timestamp
    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Create listing that expires in 1 hour (3600 seconds)
    let expiry = 1000 + 3600;
    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000,
        &Some(expiry),
    ).unwrap();

    let listing = contract.get_listing(&listing_id).unwrap();
    assert_eq!(listing.expires_at, Some(expiry));
    assert_eq!(listing.status, ListingStatus::Active);
}

#[test]
#[should_panic(expected = "InvalidExpiry")]
fn test_create_listing_expired_time_fails() {
    let env = Env::default();
    env.mock_all_auths();

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Try to create listing with expiry in the past
    contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000,
        &Some(500), // Past timestamp
    );
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_cancel_listing_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let other_user = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000,
        &None,
    ).unwrap();

    // Other user tries to cancel seller's listing - should fail
    contract.cancel_listing(&listing_id, &other_user);
}

#[test]
#[should_panic(expected = "ListingNotActive")]
fn test_cancel_already_cancelled_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000,
        &None,
    ).unwrap();

    contract.cancel_listing(&listing_id, &seller);
    contract.cancel_listing(&listing_id, &seller); // Should fail
}

#[test]
fn test_make_multiple_offers() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer1 = Address::generate(&env);
    let buyer2 = Address::generate(&env);
    let buyer3 = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Multiple offers on same NFT
    let offer_id_1 = contract.make_offer(&nft_contract, &1, &buyer1, &50_0000000, &None).unwrap();
    let offer_id_2 = contract.make_offer(&nft_contract, &1, &buyer2, &60_0000000, &None).unwrap();
    let offer_id_3 = contract.make_offer(&nft_contract, &1, &buyer3, &70_0000000, &None).unwrap();

    assert_eq!(offer_id_1, 0);
    assert_eq!(offer_id_2, 1);
    assert_eq!(offer_id_3, 2);

    // Verify offers
    let offer1 = contract.get_offer(&offer_id_1).unwrap();
    let offer2 = contract.get_offer(&offer_id_2).unwrap();
    let offer3 = contract.get_offer(&offer_id_3).unwrap();

    assert_eq!(offer1.amount, 50_0000000);
    assert_eq!(offer2.amount, 60_0000000);
    assert_eq!(offer3.amount, 70_0000000);
}

#[test]
fn test_cancel_offer() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let offer_id = contract.make_offer(
        &nft_contract,
        &1,
        &buyer,
        &50_0000000,
        &None,
    ).unwrap();

    contract.cancel_offer(&offer_id, &buyer);

    // After cancellation, getting offer should fail
    assert!(contract.get_offer(&offer_id).is_err());
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_cancel_offer_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let other_user = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    let offer_id = contract.make_offer(
        &nft_contract,
        &1,
        &buyer,
        &50_0000000,
        &None,
    ).unwrap();

    // Other user tries to cancel - should fail
    contract.cancel_offer(&offer_id, &other_user);
}

#[test]
fn test_update_platform_fee() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, admin, _, _) = setup_marketplace(&env);

    assert_eq!(contract.get_platform_fee(), 250); // Initial 2.5%

    // Update to 5%
    contract.set_platform_fee(&admin, &500);

    assert_eq!(contract.get_platform_fee(), 500);
}

#[test]
#[should_panic(expected = "InvalidFee")]
fn test_update_platform_fee_too_high() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, admin, _, _) = setup_marketplace(&env);

    // Try to set fee > 10% - should fail
    contract.set_platform_fee(&admin, &1500);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_update_platform_fee_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let other_user = Address::generate(&env);

    // Non-admin tries to update fee - should fail
    contract.set_platform_fee(&other_user, &500);
}

#[test]
fn test_update_fee_recipient() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, admin, _, _) = setup_marketplace(&env);
    let new_recipient = Address::generate(&env);

    contract.set_fee_recipient(&admin, &new_recipient);

    // Successfully updated (no error means success)
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_update_fee_recipient_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let other_user = Address::generate(&env);
    let new_recipient = Address::generate(&env);

    // Non-admin tries to update - should fail
    contract.set_fee_recipient(&other_user, &new_recipient);
}

#[test]
#[should_panic(expected = "InvalidPrice")]
fn test_make_offer_zero_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Offer with 0 amount - should fail
    contract.make_offer(&nft_contract, &1, &buyer, &0, &None);
}

#[test]
#[should_panic(expected = "InvalidPrice")]
fn test_make_offer_negative_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Negative offer - should fail
    contract.make_offer(&nft_contract, &1, &buyer, &-100, &None);
}

#[test]
fn test_offer_with_expiry() {
    let env = Env::default();
    env.mock_all_auths();

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Offer that expires in 1 day
    let expiry = 1000 + (24 * 3600);
    let offer_id = contract.make_offer(
        &nft_contract,
        &1,
        &buyer,
        &50_0000000,
        &Some(expiry),
    ).unwrap();

    let offer = contract.get_offer(&offer_id).unwrap();
    assert_eq!(offer.expires_at, Some(expiry));
}

#[test]
#[should_panic(expected = "InvalidExpiry")]
fn test_make_offer_expired_time_fails() {
    let env = Env::default();
    env.mock_all_auths();

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let (contract, _, _, _) = setup_marketplace(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    // Offer with past expiry - should fail
    contract.make_offer(
        &nft_contract,
        &1,
        &buyer,
        &50_0000000,
        &Some(500),
    );
}
