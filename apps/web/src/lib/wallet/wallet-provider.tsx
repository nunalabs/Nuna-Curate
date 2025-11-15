'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { StellarWalletsKit, WalletNetwork, ISupportedWallet } from '@creit.tech/stellar-wallets-kit';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  user: any | null;
  kit: StellarWalletsKit | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  login: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  user: null,
  kit: null,
  connect: async () => {},
  disconnect: () => {},
  login: async () => {},
  signMessage: async () => '',
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
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

    // Check for saved connection and auth
    const savedAddress = localStorage.getItem('walletAddress');
    const accessToken = localStorage.getItem('accessToken');

    if (savedAddress) {
      setAddress(savedAddress);
    }

    if (accessToken) {
      // Verify token is still valid by fetching user profile
      apiClient.getProfile()
        .then((profile) => {
          setUser(profile);
          setIsAuthenticated(true);
        })
        .catch(() => {
          // Token expired, clear auth
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        });
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

          // Automatically trigger login after connecting
          toast.success('Wallet connected! Please sign the message to login.');
        },
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!kit) {
      throw new Error('Wallet not initialized');
    }

    try {
      const { signedMessage } = await kit.sign({ message });
      return signedMessage;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  };

  const login = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // Get nonce from server
      const { message, timestamp } = await apiClient.getNonce();

      // Sign the message with wallet
      toast.loading('Please sign the message in your wallet...', { id: 'signing' });
      const signature = await signMessage(message);
      toast.dismiss('signing');

      // Send signature to server for verification
      const response = await apiClient.login(address, signature, message);

      setUser(response.user);
      setIsAuthenticated(true);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.dismiss('signing');
      toast.error('Login failed. Please try again.');
    }
  };

  const disconnect = () => {
    setAddress(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('walletAddress');
    apiClient.clearAuth();
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        isAuthenticated,
        user,
        kit,
        connect,
        disconnect,
        login,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
