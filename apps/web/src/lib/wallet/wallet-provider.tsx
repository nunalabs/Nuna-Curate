'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { StellarWalletsKit, WalletNetwork, ISupportedWallet } from '@creit.tech/stellar-wallets-kit';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  kit: StellarWalletsKit | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  kit: null,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);

  useEffect(() => {
    const network =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
        ? WalletNetwork.MAINNET
        : WalletNetwork.TESTNET;

    const walletKit = new StellarWalletsKit({
      network,
      selectedWalletId: 'freighter',
      modules: [],
    });

    setKit(walletKit);

    // Check for saved connection
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  const connect = async () => {
    if (!kit) return;

    setIsConnecting(true);
    try {
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          setAddress(address);
          localStorage.setItem('walletAddress', address);
        },
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem('walletAddress');
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        kit,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
