import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Built on Stellar Soroban
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Discover, Create & Sell{' '}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Extraordinary NFTs
            </span>
          </h1>

          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            The premier NFT marketplace on Stellar. Experience lightning-fast transactions,
            minimal fees, and a curated collection of digital art.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/explore">
                Explore NFTs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/create">Create NFT</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm text-muted-foreground">NFTs</div>
            </div>
            <div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-muted-foreground">Creators</div>
            </div>
            <div>
              <div className="text-3xl font-bold">$2M+</div>
              <div className="text-sm text-muted-foreground">Volume</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5s</div>
              <div className="text-sm text-muted-foreground">Finality</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
