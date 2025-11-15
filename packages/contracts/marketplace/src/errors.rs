use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Initialization
    AlreadyInitialized = 1,
    NotInitialized = 2,

    // Listings
    ListingNotFound = 10,
    ListingNotActive = 11,
    ListingExpired = 12,

    // Offers
    OfferNotFound = 20,
    OfferExpired = 21,

    // Authorization
    Unauthorized = 30,
    CannotBuyOwnListing = 31,

    // Validation
    InvalidPrice = 40,
    InvalidFee = 41,
    InvalidExpiry = 42,

    // Transfer errors
    TransferFailed = 50,
    InsufficientBalance = 51,
}
