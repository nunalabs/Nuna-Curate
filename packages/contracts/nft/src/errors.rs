use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Initialization errors
    AlreadyInitialized = 1,
    NotInitialized = 2,

    // Token errors
    TokenNotFound = 10,
    TokenAlreadyExists = 11,
    MetadataNotFound = 12,

    // Authorization errors
    Unauthorized = 20,
    NotApproved = 21,

    // Validation errors
    InvalidAddress = 30,
    InvalidTokenId = 31,
    InvalidMetadata = 32,

    // Royalty errors
    InvalidRoyalty = 40,

    // Batch operation errors
    BatchTooLarge = 50,
    BatchEmpty = 51,
    InvalidBatchSize = 52,

    // Signature errors
    SignatureExpired = 60,
    InvalidNonce = 61,
    InvalidSignature = 62,
}
