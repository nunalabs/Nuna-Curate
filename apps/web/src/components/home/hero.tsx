import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="hero-museum">
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full glass-museum px-4 py-2 text-sm animate-fade-in-up">
            <Sparkles className="mr-2 h-4 w-4 text-museum-gold-400" />
            Built on Stellar Soroban
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-8xl animate-fade-in-up animation-delay-200">
            Bienvenido al Museo
            <span className="block text-gradient-museum">
              Digital de Arte NFT
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 animate-fade-in-up animation-delay-400">
            Explora, colecciona y posee obras de arte únicas en la blockchain de Stellar
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-fade-in-up animation-delay-600">
            <Link href="/explore">
              <button className="cta-primary">
                Explorar Colección
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </Link>
            <Link href="/create">
              <button className="cta-secondary">
                Crear NFT
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4 animate-fade-in-up animation-delay-800">
            <div className="glass-museum p-4 rounded-xl">
              <div className="text-3xl md:text-4xl font-bold text-museum-gold-400">50K+</div>
              <div className="text-sm text-white/70 mt-1">Obras de Arte</div>
            </div>
            <div className="glass-museum p-4 rounded-xl">
              <div className="text-3xl md:text-4xl font-bold text-museum-gold-400">10K+</div>
              <div className="text-sm text-white/70 mt-1">Artistas</div>
            </div>
            <div className="glass-museum p-4 rounded-xl">
              <div className="text-3xl md:text-4xl font-bold text-museum-gold-400">$2M+</div>
              <div className="text-sm text-white/70 mt-1">Volumen</div>
            </div>
            <div className="glass-museum p-4 rounded-xl">
              <div className="text-3xl md:text-4xl font-bold text-museum-gold-400">5s</div>
              <div className="text-sm text-white/70 mt-1">Finalidad</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-museum-gold-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-museum-purple-400/20 rounded-full blur-3xl animate-float animation-delay-1000" />
      </div>
    </section>
  );
}
