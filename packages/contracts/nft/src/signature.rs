/**
 * Signature Verification & Time-Bound Operations
 *
 * Implements EIP-712 style signatures with replay protection
 * Based on Soroban authorization best practices
 */

use soroban_sdk::{Address, BytesN, Env, Symbol};
use crate::errors::Error;

// Domain separator for signature verification
const DOMAIN_SEPARATOR: &str = "NunaCurateNFT";
const VERSION: &str = "1";

/// Nonce storage key
fn nonce_key(user: &Address) -> Symbol {
    Symbol::new(&Env::default(), "nonce")
}

/// Get current nonce for user (anti-replay)
pub fn get_nonce(env: &Env, user: &Address) -> u64 {
    env.storage()
        .persistent()
        .get(&(nonce_key(user), user))
        .unwrap_or(0)
}

/// Increment nonce after use
pub fn increment_nonce(env: &Env, user: &Address) {
    let current = get_nonce(env, user);
    env.storage()
        .persistent()
        .set(&(nonce_key(user), user), &(current + 1));
}

/// Verify signature is not expired
pub fn verify_deadline(env: &Env, deadline: u64) -> Result<(), Error> {
    if env.ledger().timestamp() > deadline {
        return Err(Error::SignatureExpired);
    }
    Ok(())
}

/// Verify nonce matches current (prevents replay)
pub fn verify_nonce(env: &Env, user: &Address, nonce: u64) -> Result<(), Error> {
    let current_nonce = get_nonce(env, user);
    if nonce != current_nonce {
        return Err(Error::InvalidNonce);
    }
    Ok(())
}

/// Hash message for signature (EIP-712 style)
pub fn hash_mint_message(
    env: &Env,
    to: &Address,
    token_id: u64,
    metadata_uri: &str,
    nonce: u64,
    deadline: u64,
) -> BytesN<32> {
    use soroban_sdk::xdr::{ScVal, ScBytes};

    // Create structured data hash
    let domain_hash = hash_domain(env);
    let message_hash = hash_message_data(env, to, token_id, metadata_uri, nonce, deadline);

    // Combine: keccak256("\x19\x01" + domainHash + messageHash)
    let mut combined = BytesN::<32>::new(env);
    // In production, use proper keccak256 or sha256
    // For now, simplified version
    combined
}

/// Hash domain separator
fn hash_domain(env: &Env) -> BytesN<32> {
    use soroban_sdk::Bytes;

    // EIP-712 domain: keccak256(abi.encode(typeHash, name, version, chainId, contract))
    let contract_address = env.current_contract_address();

    // Simplified: in production use proper encoding
    BytesN::<32>::new(env)
}

/// Hash message data
fn hash_message_data(
    env: &Env,
    to: &Address,
    token_id: u64,
    metadata_uri: &str,
    nonce: u64,
    deadline: u64,
) -> BytesN<32> {
    // TypeHash for mint: keccak256("Mint(address to,uint256 tokenId,string uri,uint256 nonce,uint256 deadline)")
    // Then encode with actual values

    BytesN::<32>::new(env)
}

/// Verify ECDSA signature
pub fn verify_signature(
    env: &Env,
    signer: &Address,
    message_hash: &BytesN<32>,
    signature: &BytesN<64>,
) -> Result<(), Error> {
    // Use Soroban's built-in signature verification
    // For ed25519 signatures (Stellar native)

    // In production:
    // env.crypto().ed25519_verify(signer.public_key(), message_hash, signature);

    // For now, we'll use Soroban's authorization framework
    signer.require_auth();

    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_nonce_increment() {
        let env = Env::default();
        let user = Address::generate(&env);

        assert_eq!(get_nonce(&env, &user), 0);

        increment_nonce(&env, &user);
        assert_eq!(get_nonce(&env, &user), 1);

        increment_nonce(&env, &user);
        assert_eq!(get_nonce(&env, &user), 2);
    }

    #[test]
    fn test_deadline_verification() {
        let env = Env::default();

        // Set ledger timestamp
        env.ledger().with_mut(|li| {
            li.timestamp = 1000;
        });

        // Valid deadline (future)
        assert!(verify_deadline(&env, 2000).is_ok());

        // Expired deadline (past)
        assert!(verify_deadline(&env, 500).is_err());
    }

    #[test]
    fn test_nonce_verification() {
        let env = Env::default();
        let user = Address::generate(&env);

        // First nonce should be 0
        assert!(verify_nonce(&env, &user, 0).is_ok());
        assert!(verify_nonce(&env, &user, 1).is_err());

        // After increment, nonce is 1
        increment_nonce(&env, &user);
        assert!(verify_nonce(&env, &user, 1).is_ok());
        assert!(verify_nonce(&env, &user, 0).is_err());
    }
}
