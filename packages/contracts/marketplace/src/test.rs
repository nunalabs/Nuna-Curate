#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn create_marketplace_contract<'a>(env: &Env) -> MarketplaceContractClient<'a> {
    MarketplaceContractClient::new(env, &env.register_contract(None, MarketplaceContract {}))
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let fee_bps = 250; // 2.5%

    contract.initialize(&admin, &fee_bps, &fee_recipient);

    assert_eq!(contract.get_platform_fee(), fee_bps);
    assert_eq!(contract.get_admin(), admin);
}

#[test]
fn test_create_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    contract.initialize(&admin, &250, &fee_recipient);

    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000, // 100 XLM
        &None,
    );

    assert_eq!(listing_id, 0);

    let listing = contract.get_listing(&listing_id);
    assert_eq!(listing.seller, seller);
    assert_eq!(listing.price, 100_0000000);
    assert_eq!(listing.status, ListingStatus::Active);
}

#[test]
fn test_cancel_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    contract.initialize(&admin, &250, &fee_recipient);

    let listing_id = contract.create_listing(
        &nft_contract,
        &1,
        &seller,
        &100_0000000,
        &None,
    );

    contract.cancel_listing(&listing_id, &seller);

    let listing = contract.get_listing(&listing_id);
    assert_eq!(listing.status, ListingStatus::Cancelled);
}

#[test]
fn test_make_offer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let buyer = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    contract.initialize(&admin, &250, &fee_recipient);

    let offer_id = contract.make_offer(
        &nft_contract,
        &1,
        &buyer,
        &50_0000000, // 50 XLM
        &None,
    );

    assert_eq!(offer_id, 0);

    let offer = contract.get_offer(&offer_id);
    assert_eq!(offer.buyer, buyer);
    assert_eq!(offer.amount, 50_0000000);
}

#[test]
#[should_panic(expected = "InvalidPrice")]
fn test_create_listing_invalid_price() {
    let env = Env::default();
    env.mock_all_auths();

    let contract = create_marketplace_contract(&env);
    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let seller = Address::generate(&env);
    let nft_contract = Address::generate(&env);

    contract.initialize(&admin, &250, &fee_recipient);

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

    // Should fail: fee > 10%
    contract.initialize(&admin, &1100, &fee_recipient);
}
