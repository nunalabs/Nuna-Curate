import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nuna Curate - NFT Marketplace on Stellar',
  description: 'A premium NFT marketplace built on Stellar Soroban. Create, buy, and sell NFTs with fast transactions and low fees.',
  keywords: ['NFT', 'Stellar', 'Soroban', 'Marketplace', 'Digital Art', 'Blockchain'],
  authors: [{ name: 'Nuna Curate Team' }],
  openGraph: {
    title: 'Nuna Curate - NFT Marketplace',
    description: 'Premium NFT marketplace on Stellar Soroban',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-card text-card-foreground border border-border',
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
