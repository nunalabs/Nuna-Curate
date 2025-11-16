'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Collection {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  logo: string;
  creator: {
    id: string;
    username: string;
    displayName?: string;
  };
  nftCount?: number;
  floorPrice?: string;
  totalVolume?: string;
}

export function TrendingCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrendingCollections() {
      try {
        setLoading(true);
        setError(null);

        // Try to get trending collections from backend
        const response = await apiClient.getTrendingCollections(3);
        setCollections(response);
      } catch (err) {
        console.error('Failed to load trending collections:', err);
        setError('No se pudieron cargar las colecciones');
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }

    loadTrendingCollections();
  }, []);
  return (
    <section className="bg-museum-dark py-24">
      <div className="container museum-spacing">
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">
              <span className="text-gradient-gold">
                Colecciones en Tendencia
              </span>
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Las colecciones más destacadas en las últimas 24 horas
            </p>
          </div>
          <Link href="/collections">
            <button className="cta-secondary flex items-center">
              Ver Todas
              <TrendingUp className="ml-2 h-4 w-4" />
            </button>
          </Link>
        </div>

        <div className="museum-divider" />

        {/* Loading State */}
        {loading && (
          <div className="museum-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="museum-card">
                <div className="aspect-square shimmer-museum rounded-t-xl" />
                <div className="p-6 space-y-4">
                  <div className="h-8 shimmer-museum rounded" />
                  <div className="h-20 shimmer-museum rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && collections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No hay colecciones aún</p>
            <p className="text-sm text-muted-foreground">
              Sé el primero en crear una colección en Nuna Curate
            </p>
          </div>
        )}

        {/* Collections Grid - Real Data */}
        {!loading && !error && collections.length > 0 && (
          <div className="museum-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
              >
                <div className="museum-card glow-purple">
                  <div className="aspect-square overflow-hidden rounded-t-xl">
                    <Image
                      src={collection.coverImage || collection.logo || 'https://placehold.co/400x400'}
                      alt={collection.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="font-display text-2xl text-museum-purple-500 dark:text-museum-purple-400">
                      {collection.name}
                    </h3>

                    <div className="glass-museum p-4 rounded-lg space-y-2">
                      {collection.nftCount !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">NFTs</span>
                          <span className="font-semibold text-museum-gold-500">{collection.nftCount}</span>
                        </div>
                      )}
                      {collection.totalVolume && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Volumen</span>
                          <span className="font-semibold text-museum-orange-500">
                            {collection.totalVolume} XLM
                          </span>
                        </div>
                      )}
                      {collection.floorPrice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Piso</span>
                          <span className="font-semibold text-museum-gold-500">
                            {collection.floorPrice} XLM
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
