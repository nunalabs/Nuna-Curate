/**
 * Activity and social types for Nuna Curate
 */

export enum ActivityType {
  MINT = 'mint',
  TRANSFER = 'transfer',
  LIST = 'list',
  DELIST = 'delist',
  SALE = 'sale',
  OFFER = 'offer',
  OFFER_ACCEPTED = 'offer_accepted',
  AUCTION_CREATED = 'auction_created',
  BID_PLACED = 'bid_placed',
  AUCTION_WON = 'auction_won',
  FOLLOW = 'follow',
  FAVORITE = 'favorite',
}

export interface Activity {
  id: string;
  userId?: string;
  nftId?: string;
  activityType: ActivityType;
  metadata: Record<string, unknown>;
  transactionHash?: string;
  createdAt: Date;
}

export interface ActivityWithDetails extends Activity {
  user?: {
    id: string;
    walletAddress: string;
    username?: string;
    avatarUrl?: string;
  };
  nft?: {
    id: string;
    tokenId: string;
    name: string;
    imageUrl: string;
    collection: {
      name: string;
    };
  };
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Favorite {
  userId: string;
  nftId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  SALE = 'sale',
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  BID_OUTBID = 'bid_outbid',
  AUCTION_WON = 'auction_won',
  AUCTION_ENDED = 'auction_ended',
  NEW_FOLLOWER = 'new_follower',
  COLLECTION_VERIFIED = 'collection_verified',
}
