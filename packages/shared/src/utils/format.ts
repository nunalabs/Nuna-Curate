/**
 * Formatting utilities
 */

/**
 * Formats a Stellar address for display (truncates middle)
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats XLM amount with proper decimals
 */
export function formatXLM(amount: string | number, decimals = 7): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Formats large numbers with K, M, B suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Formats a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/**
 * Formats a percentage change with + or - sign
 */
export function formatPercentChange(change: number, decimals = 2): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Converts basis points to percentage
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Converts percentage to basis points
 */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/**
 * Formats IPFS URL to gateway URL
 */
export function formatIpfsUrl(ipfsHash: string, gateway = 'https://ipfs.io/ipfs'): string {
  const hash = ipfsHash.replace('ipfs://', '');
  return `${gateway}/${hash}`;
}
