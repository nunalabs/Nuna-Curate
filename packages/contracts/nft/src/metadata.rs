use soroban_sdk::String;

/// Validates metadata URI format
pub fn validate_metadata_uri(uri: &String) -> bool {
    // Basic validation - check if not empty
    // In production, you might want more sophisticated validation
    uri.len() > 0
}

/// Validates image URI format
pub fn validate_image_uri(uri: &String) -> bool {
    uri.len() > 0
}

/// Constructs full metadata URI from base URI and token ID
pub fn construct_metadata_uri(base_uri: &String, token_id: u64) -> String {
    // This would combine base_uri with token_id
    // For now, returning base_uri as-is since String concatenation
    // requires more complex handling in Soroban
    base_uri.clone()
}
