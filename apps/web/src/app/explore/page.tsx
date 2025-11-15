'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';

const fetcher = (url: string) => {
  const [_, params] = url.split('?');
  const searchParams = new URLSearchParams(params);

  return apiClient.getListings({
    status: searchParams.get('status') || 'active',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  });
};

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  const { data, error, isLoading } = useSWR(
    `/marketplace/listings?status=${filterStatus}&page=1&limit=20`,
    fetcher,
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Explore NFTs</h1>
        <p className="mt-2 text-muted-foreground">
          Discover unique digital collectibles on Stellar
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search NFTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-accent">
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* NFT Grid */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-lg border bg-card"
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

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Failed to load NFTs. Please try again.</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="rounded-lg border bg-muted/50 p-12 text-center">
          <p className="text-lg text-muted-foreground">No NFTs found</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.data.map((listing: any) => (
            <a
              key={listing.id}
              href={`/nft/${listing.nft.id}`}
              className="group overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {listing.nft.imageUrl ? (
                  <img
                    src={listing.nft.imageUrl}
                    alt={listing.nft.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="mb-1 truncate font-semibold">{listing.nft.name}</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  {listing.nft.collection?.name}
                </p>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs text-muted-foreground">Price</span>
                  <span className="font-semibold">
                    {(parseInt(listing.price) / 10000000).toFixed(2)} XLM
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta && data.meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {[...Array(data.meta.totalPages)].map((_, i) => (
            <button
              key={i}
              className={`rounded px-4 py-2 ${
                i + 1 === data.meta.page
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
