'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Share2, MoreVertical, ExternalLink, Clock, Tag } from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { apiClient } from '@/lib/api/client';

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const [isBuying, setIsBuying] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [listingPrice, setListingPrice] = useState('');

  const { data: nft, error, mutate } = useSWR(
    params.id ? `/nfts/${params.id}` : null,
    () => apiClient.getNFT(params.id as string),
  );

  const { data: listings } = useSWR(
    nft ? `/listings/nft/${nft.id}` : null,
    () => apiClient.getListings({ status: 'active', limit: 1 }),
  );

  const activeListing = listings?.data?.[0];
  const isOwner = nft?.owner?.publicKey === address;
  const isCreator = nft?.creator?.publicKey === address;

  const handleBuy = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!activeListing) {
      toast.error('No active listing found');
      return;
    }

    setIsBuying(true);
    try {
      // TODO: Execute blockchain transaction
      const txHash = 'temp_tx_hash_' + Date.now();

      await apiClient.buyListing(activeListing.id, txHash);

      toast.success('NFT purchased successfully!');
      mutate();
      router.push('/profile');
    } catch (error: any) {
      console.error('Failed to buy NFT:', error);
    } finally {
      setIsBuying(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listingPrice) {
      toast.error('Please enter a price');
      return;
    }

    setIsListing(true);
    try {
      const priceInStroops = (parseFloat(listingPrice) * 10000000).toString();

      await apiClient.createListing({
        nftId: nft.id,
        price: priceInStroops,
      });

      toast.success('NFT listed successfully!');
      setListingPrice('');
      mutate();
    } catch (error: any) {
      console.error('Failed to create listing:', error);
    } finally {
      setIsListing(false);
    }
  };

  const handleCancelListing = async () => {
    if (!activeListing) return;

    try {
      await apiClient.cancelListing(activeListing.id);
      toast.success('Listing cancelled');
      mutate();
    } catch (error: any) {
      console.error('Failed to cancel listing:', error);
    }
  };

  if (error) {
    return (
      <div className="container py-16">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Failed to load NFT. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="relative">
          <div className="sticky top-24 overflow-hidden rounded-lg border bg-muted">
            {nft.imageUrl ? (
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Collection */}
          <a
            href={`/collection/${nft.collection?.id}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {nft.collection?.name}
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold">{nft.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Owned by{' '}
              <a href={`/profile/${nft.owner?.id}`} className="text-foreground hover:underline">
                {nft.owner?.displayName || nft.owner?.username}
              </a>
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 border-b pb-4">
            <button className="inline-flex items-center gap-2 text-sm hover:text-primary">
              <Heart className="h-5 w-5" />
              <span>Favorite</span>
            </button>
            <button className="inline-flex items-center gap-2 text-sm hover:text-primary">
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
            <button className="inline-flex items-center gap-2 text-sm hover:text-primary">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          {/* Price / Buy */}
          {activeListing && !isOwner && (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-3xl font-bold">
                  {(parseInt(activeListing.price) / 10000000).toFixed(2)} XLM
                </p>
              </div>

              <button
                onClick={handleBuy}
                disabled={isBuying || !isConnected}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBuying ? 'Processing...' : 'Buy Now'}
              </button>

              {!isConnected && (
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Connect wallet to purchase
                </p>
              )}
            </div>
          )}

          {/* Listing / Cancel (Owner) */}
          {isOwner && !activeListing && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 font-semibold">List for Sale</h3>
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price (XLM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isListing}
                  className="w-full rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isListing ? 'Listing...' : 'Create Listing'}
                </button>
              </form>
            </div>
          )}

          {isOwner && activeListing && (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Listed Price</p>
                <p className="text-3xl font-bold">
                  {(parseInt(activeListing.price) / 10000000).toFixed(2)} XLM
                </p>
              </div>
              <button
                onClick={handleCancelListing}
                className="w-full rounded-lg border border-destructive px-6 py-2 font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                Cancel Listing
              </button>
            </div>
          )}

          {/* Description */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="text-muted-foreground">{nft.description}</p>
          </div>

          {/* Attributes */}
          {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 font-semibold">Attributes</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {nft.metadata.attributes.map((attr: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-muted/50 p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                    <p className="mt-1 font-semibold">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contract Address</span>
                <span className="text-sm font-mono">
                  {nft.contractAddress
                    ? `${nft.contractAddress.slice(0, 6)}...${nft.contractAddress.slice(-4)}`
                    : 'Not minted'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Token ID</span>
                <span className="text-sm">{nft.tokenId || 'Not minted'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Blockchain</span>
                <span className="text-sm">Stellar Soroban</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Royalty</span>
                <span className="text-sm">{nft.royaltyPercentage}%</span>
              </div>
              {nft.metadataUrl && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Metadata</span>
                  <a
                    href={nft.metadataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    IPFS
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
