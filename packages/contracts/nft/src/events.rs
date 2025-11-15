use soroban_sdk::{Address, Env, String, Symbol, symbol_short};

// Event topics
const COLLECTION_CREATED: Symbol = symbol_short!("coll_new");
const MINT: Symbol = symbol_short!("mint");
const TRANSFER: Symbol = symbol_short!("transfer");
const APPROVAL: Symbol = symbol_short!("approve");
const APPROVAL_ALL: Symbol = symbol_short!("appr_all");
const BURN: Symbol = symbol_short!("burn");

pub fn emit_collection_created(env: &Env, name: &String, symbol: &String, admin: &Address) {
    env.events().publish((COLLECTION_CREATED,), (name, symbol, admin));
}

pub fn emit_mint(env: &Env, to: &Address, token_id: u64, metadata_uri: &String) {
    env.events().publish((MINT, to), (token_id, metadata_uri));
}

pub fn emit_transfer(env: &Env, from: &Address, to: &Address, token_id: u64) {
    env.events().publish((TRANSFER, from, to), token_id);
}

pub fn emit_approval(env: &Env, owner: &Address, approved: &Address, token_id: u64) {
    env.events().publish((APPROVAL, owner, approved), token_id);
}

pub fn emit_approval_for_all(env: &Env, owner: &Address, operator: &Address, approved: bool) {
    env.events().publish((APPROVAL_ALL, owner, operator), approved);
}

pub fn emit_burn(env: &Env, owner: &Address, token_id: u64) {
    env.events().publish((BURN, owner), token_id);
}
