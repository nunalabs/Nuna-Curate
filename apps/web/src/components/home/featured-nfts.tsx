'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUrl: string;
  creator: {
    id: string;
    username: string;
    displayName?: string;
  };
  owner: {
    id: string;
    username: string;
  };
  collection: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
}

export function FeaturedNFTs() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeaturedNFTs() {
      try {
        setLoading(true);
        setError(null);

        // Try to get trending NFTs from backend
        const response = await apiClient.getTrendingNFTs(6);
        setNfts(response);
      } catch (err) {
        console.error('Failed to load featured NFTs:', err);
        setError('No se pudieron cargar los NFTs destacados');
        setNfts([]);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedNFTs();
  }, []);
  return (
    <section className="container py-24 museum-spacing">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-display text-4xl md:text-5xl mb-6">
          <span className="text-gradient-museum">
            Obras Destacadas
          </span>
        </h2>
        <p className="text-xl text-muted-foreground">
          Explora nuestra selección curada de arte digital excepcional
        </p>
      </div>

      {/* Decorative divider */}
      <div className="museum-divider" />

      {/* Loading State */}
      {loading && (
        <div className="museum-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="museum-card">
              <div className="aspect-square shimmer-museum rounded-t-xl" />
              <div className="p-6 space-y-4">
                <div className="h-8 shimmer-museum rounded" />
                <div className="h-4 shimmer-museum rounded w-2/3" />
                <div className="h-12 shimmer-museum rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            El backend no está disponible. Por favor, inicia el servidor backend o espera a que los contratos sean deployados.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && nfts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No hay NFTs destacados aún</p>
          <p className="text-sm text-muted-foreground">
            Sé el primero en crear un NFT en Nuna Curate
          </p>
          <Link href="/create">
            <button className="cta-primary mt-6">
              Crear NFT
            </button>
          </Link>
        </div>
      )}

      {/* NFT Grid - Real Data */}
      {!loading && !error && nfts.length > 0 && (
        <div className="museum-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {nfts.map((nft, index) => {
            // Mark first 3 as premium for visual variety
            const isPremium = index < 3;

            return (
              <Link key={nft.id} href={`/nft/${nft.id}`}>
                <div className={`nft-card group ${isPremium ? 'golden-frame' : ''}`}>
                  {/* Premium Badge */}
                  {isPremium && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="badge-premium">
                        ✨ Premium
                      </span>
                    </div>
                  )}

                  {/* NFT Image */}
                  <div className="nft-card-image">
                    <Image
                      src={nft.imageUrl || 'https://placehold.co/400x400'}
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* NFT Content */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-display text-2xl text-museum-purple-500 dark:text-museum-purple-400">
                      {nft.name}
                    </h3>

                    <p className="text-muted-foreground">
                      Por {nft.creator.displayName || nft.creator.username}
                    </p>

                    {/* Collection */}
                    <div className="text-sm text-muted-foreground">
                      {nft.collection.name}
                    </div>

                    {/* CTA */}
                    <button className="cta-secondary w-full">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
