'use client';

import { SWRConfig } from 'swr';
import { WalletProvider } from '@/lib/wallet/wallet-provider';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <WalletProvider>{children}</WalletProvider>
    </SWRConfig>
  );
}
