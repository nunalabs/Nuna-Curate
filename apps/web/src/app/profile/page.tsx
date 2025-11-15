'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import useSWR from 'swr';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { apiClient } from '@/lib/api/client';

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState<'collected' | 'created' | 'activity'>('collected');

  const { data: profile } = useSWR(
    isConnected ? '/users/me' : null,
    () => apiClient.getProfile(),
  );

  const { data: collectedNFTs } = useSWR(
    isConnected && activeTab === 'collected' ? '/nfts/collected' : null,
    () => apiClient.getNFTs({ ownerId: profile?.id }),
  );

  const { data: createdNFTs } = useSWR(
    isConnected && activeTab === 'created' ? '/nfts/created' : null,
    () => apiClient.getNFTs({ creatorId: profile?.id }),
  );

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="mt-4 text-muted-foreground">
            Please connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  const nftsToDisplay = activeTab === 'collected' ? collectedNFTs : createdNFTs;

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 md:h-64" />

      {/* Profile Info */}
      <div className="container">
        <div className="relative -mt-16 md:-mt-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="h-24 w-24 overflow-hidden rounded-lg border-4 border-background bg-muted md:h-32 md:w-32">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-bold md:text-4xl">
                    {profile?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Name & Bio */}
              <div className="pb-2">
                <h1 className="text-2xl font-bold md:text-3xl">
                  {profile?.displayName || profile?.username || 'Anonymous'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {address && `${address.slice(0, 8)}...${address.slice(-6)}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-2">
              <button className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm hover:bg-accent">
                <Settings className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>

          {profile?.bio && (
            <p className="mt-4 max-w-2xl text-muted-foreground">{profile.bio}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('collected')}
              className={`relative pb-4 text-sm font-medium transition-colors ${
                activeTab === 'collected'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Collected
              {activeTab === 'collected' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('created')}
              className={`relative pb-4 text-sm font-medium transition-colors ${
                activeTab === 'created'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Created
              {activeTab === 'created' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`relative pb-4 text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Activity
              {activeTab === 'activity' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-8">
          {activeTab === 'activity' ? (
            <div className="rounded-lg border bg-muted/50 p-12 text-center">
              <p className="text-muted-foreground">Activity feed coming soon</p>
            </div>
          ) : (
            <>
              {!nftsToDisplay && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
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

              {nftsToDisplay && nftsToDisplay.data.length === 0 && (
                <div className="rounded-lg border bg-muted/50 p-12 text-center">
                  <p className="text-lg text-muted-foreground">
                    {activeTab === 'collected'
                      ? 'No NFTs collected yet'
                      : 'No NFTs created yet'}
                  </p>
                  <a
                    href="/explore"
                    className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
                  >
                    {activeTab === 'collected' ? 'Explore NFTs' : 'Create NFT'}
                  </a>
                </div>
              )}

              {nftsToDisplay && nftsToDisplay.data.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {nftsToDisplay.data.map((nft: any) => (
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
                          {nft.collection?.name}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
