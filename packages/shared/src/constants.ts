/**
 * Application constants
 */

// Platform fees (in basis points, 100 = 1%)
export const PLATFORM_FEE_BPS = 250; // 2.5%

// Max royalty (in basis points)
export const MAX_ROYALTY_BPS = 1000; // 10%

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

// Token limits
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const CHALLENGE_EXPIRY = '5m';

// Rate limits (requests per window)
export const RATE_LIMIT_PUBLIC = 100; // per 15 minutes
export const RATE_LIMIT_AUTHENTICATED = 300; // per 15 minutes
export const RATE_LIMIT_PREMIUM = 1000; // per 15 minutes

// Blockchain
export const DEFAULT_NETWORK = 'testnet';
export const TRANSACTION_TIMEOUT = 30; // seconds

// Cache TTL (in seconds)
export const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  NFT_DETAILS: 300,
  COLLECTION: 600, // 10 minutes
  LISTING: 60, // 1 minute
  TRENDING: 300,
  STATS: 300,
};

// WebSocket events
export const WS_EVENTS = {
  // Auction events
  AUCTION_BID: 'auction:bid',
  AUCTION_EXTENDED: 'auction:extended',
  AUCTION_FINALIZED: 'auction:finalized',

  // Listing events
  LISTING_CREATED: 'listing:created',
  LISTING_SOLD: 'listing:sold',
  LISTING_CANCELLED: 'listing:cancelled',

  // NFT events
  NFT_MINTED: 'nft:minted',
  NFT_TRANSFERRED: 'nft:transferred',

  // User events
  OFFER_RECEIVED: 'user:offer_received',
  NOTIFICATION: 'user:notification',
};
