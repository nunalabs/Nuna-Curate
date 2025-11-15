/**
 * Marketplace types for Nuna Curate
 */

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum OfferStatus {
  ACTIVE = 'active',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum AuctionStatus {
  ACTIVE = 'active',
  FINALIZED = 'finalized',
  CANCELLED = 'cancelled',
}

export enum AuctionType {
  ENGLISH = 'english', // Ascending price
  DUTCH = 'dutch', // Descending price
  SEALED = 'sealed', // Sealed bid
}

export interface Listing {
  id: string;
  nftId: string;
  sellerId: string;
  price: string; // XLM amount as string
  currency: string; // 'XLM' or asset code
  status: ListingStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingWithNFT extends Listing {
  nft: {
    id: string;
    tokenId: string;
    name: string;
    imageUrl: string;
    collection: {
      id: string;
      name: string;
      contractAddress: string;
    };
  };
  seller: {
    id: string;
    walletAddress: string;
    username?: string;
  };
}

export interface CreateListingDto {
  nftId: string;
  price: string;
  currency?: string;
  expiresAt?: Date;
}

export interface Offer {
  id: string;
  nftId: string;
  buyerId: string;
  amount: string;
  currency: string;
  status: OfferStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferWithDetails extends Offer {
  nft: {
    id: string;
    tokenId: string;
    name: string;
    imageUrl: string;
  };
  buyer: {
    id: string;
    walletAddress: string;
    username?: string;
  };
}

export interface CreateOfferDto {
  nftId: string;
  amount: string;
  currency?: string;
  expiresAt?: Date;
}

export interface Auction {
  id: string;
  nftId: string;
  sellerId: string;
  startingPrice: string;
  reservePrice?: string;
  currentBid?: string;
  currentBidderId?: string;
  bidCount: number;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionWithDetails extends Auction {
  nft: {
    id: string;
    tokenId: string;
    name: string;
    imageUrl: string;
    collection: {
      name: string;
    };
  };
  seller: {
    id: string;
    walletAddress: string;
    username?: string;
  };
  currentBidder?: {
    id: string;
    walletAddress: string;
    username?: string;
  };
}

export interface CreateAuctionDto {
  nftId: string;
  startingPrice: string;
  reservePrice?: string;
  auctionType: AuctionType;
  startTime: Date;
  endTime: Date;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: string;
  isWinning: boolean;
  createdAt: Date;
}

export interface PlaceBidDto {
  auctionId: string;
  amount: string;
}

export interface Sale {
  id: string;
  nftId: string;
  sellerId: string;
  buyerId: string;
  price: string;
  currency: string;
  saleType: 'listing' | 'offer' | 'auction';
  transactionHash: string;
  platformFee: string;
  royaltyFee: string;
  soldAt: Date;
}

export interface SaleWithDetails extends Sale {
  nft: {
    id: string;
    tokenId: string;
    name: string;
    imageUrl: string;
    collection: {
      name: string;
    };
  };
  seller: {
    walletAddress: string;
    username?: string;
  };
  buyer: {
    walletAddress: string;
    username?: string;
  };
}
