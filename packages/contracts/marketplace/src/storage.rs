use soroban_sdk::{Address, Env};
use crate::{Listing, Offer, errors::Error};

// Storage keys
const ADMIN_KEY: &str = "admin";
const PLATFORM_FEE_KEY: &str = "fee";
const FEE_RECIPIENT_KEY: &str = "fee_rcpt";
const LISTING_COUNTER_KEY: &str = "list_cnt";
const OFFER_COUNTER_KEY: &str = "offr_cnt";

fn listing_key(listing_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("listing")
}

fn offer_key(offer_id: u64) -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("offer")
}

fn active_listings_key() -> soroban_sdk::Symbol {
    soroban_sdk::symbol_short!("act_list")
}

// ========== INITIALIZATION ==========

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

// ========== LISTINGS ==========

pub fn save_listing(env: &Env, listing_id: u64, listing: &Listing) {
    env.storage()
        .persistent()
        .set(&(listing_key(listing_id), listing_id), listing);
}

pub fn get_listing(env: &Env, listing_id: u64) -> Result<Listing, Error> {
    env.storage()
        .persistent()
        .get(&(listing_key(listing_id), listing_id))
        .ok_or(Error::ListingNotFound)
}

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

// ========== OFFERS ==========

pub fn save_offer(env: &Env, offer_id: u64, offer: &Offer) {
    env.storage()
        .persistent()
        .set(&(offer_key(offer_id), offer_id), offer);
}

pub fn get_offer(env: &Env, offer_id: u64) -> Result<Offer, Error> {
    env.storage()
        .persistent()
        .get(&(offer_key(offer_id), offer_id))
        .ok_or(Error::OfferNotFound)
}

pub fn remove_offer(env: &Env, offer_id: u64) {
    env.storage()
        .persistent()
        .remove(&(offer_key(offer_id), offer_id));
}
