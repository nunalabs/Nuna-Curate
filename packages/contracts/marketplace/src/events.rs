use soroban_sdk::{Address, Env, Symbol, symbol_short};

// Event topics
const MARKETPLACE_INIT: Symbol = symbol_short!("mrkt_init");
const LISTING_CREATED: Symbol = symbol_short!("list_new");
const LISTING_CANCELLED: Symbol = symbol_short!("list_cnl");
const SALE: Symbol = symbol_short!("sale");
const OFFER_MADE: Symbol = symbol_short!("offr_made");
const OFFER_ACCEPTED: Symbol = symbol_short!("offr_acc");
const OFFER_CANCELLED: Symbol = symbol_short!("offr_cnl");
const FEE_UPDATED: Symbol = symbol_short!("fee_upd");

pub fn emit_marketplace_initialized(env: &Env, admin: &Address, fee_bps: u32) {
    env.events().publish((MARKETPLACE_INIT,), (admin, fee_bps));
}

pub fn emit_listing_created(
    env: &Env,
    listing_id: u64,
    nft_contract: &Address,
    token_id: u64,
    seller: &Address,
    price: i128,
) {
    env.events().publish(
        (LISTING_CREATED, seller),
        (listing_id, nft_contract, token_id, price),
    );
}

pub fn emit_listing_cancelled(env: &Env, listing_id: u64, seller: &Address) {
    env.events().publish((LISTING_CANCELLED, seller), listing_id);
}

pub fn emit_sale(
    env: &Env,
    listing_id: u64,
    nft_contract: &Address,
    token_id: u64,
    seller: &Address,
    buyer: &Address,
    price: i128,
    platform_fee: i128,
    royalty_fee: i128,
) {
    env.events().publish(
        (SALE, seller, buyer),
        (listing_id, nft_contract, token_id, price, platform_fee, royalty_fee),
    );
}

pub fn emit_offer_made(
    env: &Env,
    offer_id: u64,
    nft_contract: &Address,
    token_id: u64,
    buyer: &Address,
    amount: i128,
) {
    env.events().publish(
        (OFFER_MADE, buyer),
        (offer_id, nft_contract, token_id, amount),
    );
}

pub fn emit_offer_accepted(
    env: &Env,
    offer_id: u64,
    nft_contract: &Address,
    token_id: u64,
    seller: &Address,
    buyer: &Address,
    amount: i128,
) {
    env.events().publish(
        (OFFER_ACCEPTED, seller, buyer),
        (offer_id, nft_contract, token_id, amount),
    );
}

pub fn emit_offer_cancelled(env: &Env, offer_id: u64, buyer: &Address) {
    env.events().publish((OFFER_CANCELLED, buyer), offer_id);
}

pub fn emit_fee_updated(env: &Env, new_fee_bps: u32) {
    env.events().publish((FEE_UPDATED,), new_fee_bps);
}
