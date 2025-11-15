import { Hero } from '@/components/home/hero';
import { TrendingCollections } from '@/components/home/trending-collections';
import { FeaturedNFTs } from '@/components/home/featured-nfts';
import { Stats } from '@/components/home/stats';
import { HowItWorks } from '@/components/home/how-it-works';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
      <TrendingCollections />
      <FeaturedNFTs />
      <HowItWorks />
    </div>
  );
}
