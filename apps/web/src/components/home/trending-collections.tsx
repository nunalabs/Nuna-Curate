'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

// Placeholder data - replace with actual API call
const collections = [
  {
    id: '1',
    name: 'Stellar Punks',
    image: 'https://placehold.co/400x400',
    volume: '125,000',
    change: '+25.5%',
  },
  {
    id: '2',
    name: 'Cosmic Cats',
    image: 'https://placehold.co/400x400',
    volume: '98,500',
    change: '+18.2%',
  },
  {
    id: '3',
    name: 'Digital Dreams',
    image: 'https://placehold.co/400x400',
    volume: '76,200',
    change: '+12.8%',
  },
];

export function TrendingCollections() {
  return (
    <section className="border-t bg-muted/50 py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Trending Collections
            </h2>
            <p className="mt-2 text-muted-foreground">
              Top performing collections in the last 24 hours
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/collections">
              View All
              <TrendingUp className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden">
                <Image
                  src={collection.image}
                  alt={collection.name}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{collection.name}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{collection.volume} XLM</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">24h</span>
                  <span className="font-medium text-green-600">
                    {collection.change}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
