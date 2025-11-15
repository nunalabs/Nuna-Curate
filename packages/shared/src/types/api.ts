/**
 * API request/response types for Nuna Curate
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Permissions
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Blockchain
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface FilterParams {
  collectionId?: string;
  creatorId?: string;
  ownerId?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  search?: string;
  traits?: Record<string, string[]>;
}

export interface SortParams {
  sortBy: 'price' | 'createdAt' | 'rarity' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface UploadResponse {
  url: string;
  ipfsHash: string;
  arweaveId?: string;
}
