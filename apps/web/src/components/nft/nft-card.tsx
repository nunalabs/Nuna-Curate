'use client';

/**
 * NFTCard Component
 *
 * Displays NFT information in a card format
 * Optimized for performance with Next.js Image
 */

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface NFT {
  id: string;
  tokenId: number;
  name: string;
  description?: string;
  image: string;
  collectionId: string;
  collectionName: string;
  owner: string;
  creator: string;
  price?: string;
  currency?: string;
  isListed?: boolean;
  isFavorite?: boolean;
  views?: number;
  likes?: number;
}

interface NFTCardProps {
  nft: NFT;
  onFavorite?: (nftId: string) => void;
  onBuy?: (nftId: string) => void;
  className?: string;
  showPrice?: boolean;
  showActions?: boolean;
}

export function NFTCard({
  nft,
  onFavorite,
  onBuy,
  className,
  showPrice = true,
  showActions = true,
}: NFTCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(nft.isFavorite || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onFavorite) {
      setIsFavorited(!isFavorited);
      onFavorite(nft.id);
    }
  };

  const handleBuy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onBuy && !isLoading) {
      setIsLoading(true);
      try {
        await onBuy(nft.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Link href={`/nft/${nft.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg',
          'hover:-translate-y-1',
          className
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageError ? (
            <Image
              src={nft.image}
              alt={nft.name}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">Image not available</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />

          {/* Favorite Button */}
          {showActions && (
            <button
              onClick={handleFavorite}
              className={cn(
                'absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-md transition-all',
                'hover:bg-white hover:scale-110',
                isFavorited && 'text-red-500'
              )}
            >
              <Heart
                className={cn('h-4 w-4', isFavorited && 'fill-current')}
              />
            </button>
          )}

          {/* Stats */}
          <div className="absolute bottom-2 left-2 flex gap-2">
            {nft.views !== undefined && (
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                <Eye className="h-3 w-3" />
                <span>{nft.views}</span>
              </div>
            )}
            {nft.likes !== undefined && (
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                <Heart className="h-3 w-3" />
                <span>{nft.likes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Collection Name */}
          <p className="mb-1 text-xs text-muted-foreground">
            {nft.collectionName}
          </p>

          {/* NFT Name */}
          <h3 className="mb-2 font-semibold line-clamp-1">{nft.name}</h3>

          {/* Description */}
          {nft.description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {nft.description}
            </p>
          )}

          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            {showPrice && nft.price ? (
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-bold">
                  {nft.price} {nft.currency || 'XLM'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium">
                  {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                </p>
              </div>
            )}

            {showActions && nft.isListed && (
              <Button
                size="sm"
                onClick={handleBuy}
                disabled={isLoading}
                className="group-hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Buying...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-1 h-4 w-4" />
                    Buy Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Sale Badge */}
        {nft.isListed && (
          <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            For Sale
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * NFTCardSkeleton Component
 *
 * Loading state for NFTCard
 */
export function NFTCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        className
      )}
    >
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="p-4">
        <div className="mb-1 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mb-2 h-5 w-full animate-pulse rounded bg-muted" />
        <div className="mb-3 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between">
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/**
 * NFTGrid Component
 *
 * Responsive grid for displaying multiple NFTs
 */
interface NFTGridProps {
  nfts: NFT[];
  isLoading?: boolean;
  onFavorite?: (nftId: string) => void;
  onBuy?: (nftId: string) => void;
  className?: string;
}

export function NFTGrid({
  nfts,
  isLoading = false,
  onFavorite,
  onBuy,
  className,
}: NFTGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No NFTs found
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          onFavorite={onFavorite}
          onBuy={onBuy}
        />
      ))}
    </div>
  );
}
