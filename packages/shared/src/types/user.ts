/**
 * User and authentication types for Nuna Curate
 */

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  twitterHandle?: string;
  instagramHandle?: string;
  websiteUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  nftCount: number;
  collectionsCount: number;
  followersCount: number;
  followingCount: number;
  totalSales: number;
  totalVolume: string; // Stored as string to handle big numbers
}

export interface CreateUserDto {
  walletAddress: string;
  username?: string;
  email?: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  twitterHandle?: string;
  instagramHandle?: string;
  websiteUrl?: string;
}

export interface AuthChallenge {
  challenge: string;
  expiresAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // User ID
  walletAddress: string;
  iat: number;
  exp: number;
}
