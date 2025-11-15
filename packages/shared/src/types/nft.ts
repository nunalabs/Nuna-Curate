/**
 * NFT and Collection types for Nuna Curate
 */

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  properties?: Record<string, unknown>;
  animation_url?: string;
  background_color?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
  max_value?: number;
}

export interface NFT {
  id: string;
  collectionId: string;
  tokenId: string;
  ownerId: string;
  creatorId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUri: string;
  metadata: NFTMetadata;
  rarityScore?: number;
  rarityRank?: number;
  mintedAt: Date;
  updatedAt: Date;
}

export interface NFTWithRelations extends NFT {
  owner: {
    id: string;
    walletAddress: string;
    username?: string;
    avatarUrl?: string;
  };
  creator: {
    id: string;
    walletAddress: string;
    username?: string;
    avatarUrl?: string;
  };
  collection: {
    id: string;
    name: string;
    symbol: string;
    contractAddress: string;
  };
  listing?: Listing;
}

export interface Collection {
  id: string;
  contractAddress: string;
  creatorId: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  baseUri?: string;
  royaltyReceiver?: string;
  royaltyBps: number; // Basis points (100 = 1%)
  totalSupply: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionWithStats extends Collection {
  nftCount: number;
  ownerCount: number;
  floorPrice?: string;
  totalVolume: string;
  volumeChange24h?: number;
}

export interface CreateCollectionDto {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  royaltyBps: number;
}

export interface MintNFTDto {
  collectionId: string;
  name: string;
  description: string;
  imageFile: File | Buffer;
  attributes?: NFTAttribute[];
  properties?: Record<string, unknown>;
}

export enum NFTStatus {
  MINTED = 'minted',
  LISTED = 'listed',
  SOLD = 'sold',
  BURNED = 'burned',
}
