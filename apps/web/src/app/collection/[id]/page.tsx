'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ExternalLink, Globe, Twitter } from 'lucide-react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';

export default function CollectionDetailPage() {
  const params = useParams();
  const [activeFilter, setActiveFilter] = useState<'all' | 'listed' | 'owned'>('all');

  const { data: collection, error } = useSWR(
    params.id ? `/collections/${params.id}` : null,
    () => apiClient.getCollection(params.id as string),
  );

  const { data: stats } = useSWR(
    params.id ? `/collections/${params.id}/stats` : null,
    () => apiClient.getCollection(params.id as string).then(() => ({
      totalNFTs: 0,
      totalVolume: '0',
      floorPrice: null,
      owners: 0,
      listed: 0,
    })),
  );

  const { data: nfts } = useSWR(
    params.id ? `/nfts/collection/${params.id}` : null,
    () => apiClient.getNFTs({ collectionId: params.id as string, limit: 50 }),
  );

  if (error) {
    return (
      <div className="container py-16">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Failed to load collection. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container py-8">
        <div className="h-48 animate-pulse rounded-lg bg-muted md:h-64" />
        <div className="mx-auto -mt-12 max-w-4xl space-y-4">
          <div className="h-24 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div
        className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 md:h-64"
        style={
          collection.bannerUrl
            ? {
                backgroundImage: `url(${collection.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      />

      {/* Collection Info */}
      <div className="container">
        <div className="mx-auto max-w-4xl">
          <div className="relative -mt-12 md:-mt-16">
            {/* Logo */}
            <div className="mb-4 h-24 w-24 overflow-hidden rounded-lg border-4 border-background bg-muted md:h-32 md:w-32">
              {collection.imageUrl ? (
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-bold md:text-4xl">
                  {collection.name[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Description */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-3xl font-bold md:text-4xl">{collection.name}</h1>
                {collection.symbol && (
                  <span className="rounded bg-muted px-2 py-1 text-sm font-mono">
                    {collection.symbol}
                  </span>
                )}
              </div>

              <p className="mb-4 text-muted-foreground">
                By{' '}
                <a
                  href={`/profile/${collection.creator?.id}`}
                  className="text-foreground hover:underline"
                >
                  {collection.creator?.displayName || collection.creator?.username}
                </a>
              </p>

              <p className="max-w-2xl text-muted-foreground">{collection.description}</p>
            </div>

            {/* Links */}
            <div className="mb-6 flex gap-4">
              {collection.externalUrl && (
                <a
                  href={collection.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Twitter className="h-4 w-4" />
                Twitter
              </button>
              <a
                href={collection.metadataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                IPFS
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-6 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-2xl font-bold">{stats?.totalNFTs || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owners</p>
                <p className="text-2xl font-bold">{stats?.owners || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Floor Price</p>
                <p className="text-2xl font-bold">
                  {stats?.floorPrice ? `${stats.floorPrice} XLM` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="text-2xl font-bold">
                  {stats?.totalVolume ? `${parseFloat(stats.totalVolume).toFixed(2)} XLM` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 border-b">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveFilter('all')}
                className={`relative pb-4 text-sm font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Items
                {activeFilter === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>

              <button
                onClick={() => setActiveFilter('listed')}
                className={`relative pb-4 text-sm font-medium transition-colors ${
                  activeFilter === 'listed'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Listed
                {activeFilter === 'listed' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>

              <button
                onClick={() => setActiveFilter('owned')}
                className={`relative pb-4 text-sm font-medium transition-colors ${
                  activeFilter === 'owned'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                My Items
                {activeFilter === 'owned' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* NFT Grid */}
          <div className="py-8">
            {!nfts && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-lg border"
                  >
                    <div className="aspect-square bg-muted" />
                    <div className="p-4">
                      <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {nfts && nfts.data.length === 0 && (
              <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <p className="text-lg text-muted-foreground">No NFTs in this collection yet</p>
              </div>
            )}

            {nfts && nfts.data.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {nfts.data.map((nft: any) => (
                  <a
                    key={nft.id}
                    href={`/nft/${nft.id}`}
                    className="group overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      {nft.imageUrl ? (
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="mb-1 truncate font-semibold">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {nft.owner?.displayName || nft.owner?.username}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
