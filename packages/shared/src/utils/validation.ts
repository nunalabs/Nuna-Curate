/**
 * Validation utilities
 */

import { MAX_ROYALTY_BPS } from '../constants';

/**
 * Validates a Stellar public key (G... address)
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * Validates a contract address (C... address)
 */
export function isValidContractAddress(address: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(address);
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a username (3-30 chars, alphanumeric + underscore)
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

/**
 * Validates royalty basis points (0-1000 = 0-10%)
 */
export function isValidRoyaltyBps(bps: number): boolean {
  return Number.isInteger(bps) && bps >= 0 && bps <= MAX_ROYALTY_BPS;
}

/**
 * Validates a price string (must be positive number)
 */
export function isValidPrice(price: string): boolean {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Validates IPFS hash
 */
export function isValidIpfsHash(hash: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash);
}

/**
 * Validates URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000); // Max length
}

/**
 * Validates pagination parameters
 */
export function isValidPagination(page?: number, limit?: number): boolean {
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    return false;
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    return false;
  }
  return true;
}
