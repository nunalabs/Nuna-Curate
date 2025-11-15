/**
 * Analytics and statistics types for Nuna Curate
 */

export interface PlatformStats {
  totalUsers: number;
  totalNFTs: number;
  totalCollections: number;
  totalVolume: string;
  totalSales: number;
  volume24h: string;
  volumeChange24h: number;
  sales24h: number;
  activeListings: number;
  floorPrice?: string;
}

export interface CollectionStats {
  collectionId: string;
  nftCount: number;
  ownerCount: number;
  floorPrice?: string;
  totalVolume: string;
  volume24h: string;
  volumeChange24h: number;
  sales24h: number;
  averagePrice: string;
  highestSale: string;
  listedCount: number;
}

export interface UserStats {
  userId: string;
  nftsOwned: number;
  nftsCreated: number;
  collectionCount: number;
  totalSales: number;
  totalPurchases: number;
  totalVolume: string;
  earnings: string;
  spent: string;
}

export interface TrendingCollection {
  collectionId: string;
  name: string;
  imageUrl?: string;
  volume24h: string;
  volumeChange24h: number;
  sales24h: number;
  floorPrice?: string;
  rank: number;
}

export interface PriceHistory {
  nftId: string;
  price: string;
  timestamp: Date;
  eventType: 'sale' | 'listing';
}

export interface VolumeHistory {
  date: string; // ISO date string
  volume: string;
  sales: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export enum TimeRangePreset {
  HOUR_24 = '24h',
  DAYS_7 = '7d',
  DAYS_30 = '30d',
  ALL_TIME = 'all',
}
