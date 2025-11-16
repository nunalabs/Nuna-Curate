/**
 * useWallet Hook
 *
 * React hook for managing Stellar wallet connection and interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { stellarWalletService, WalletState, NFTMetadata } from '@/lib/wallet/stellar';
import { toast } from 'react-hot-toast';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    walletId: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state
  useEffect(() => {
    const currentState = stellarWalletService.getState();
    setState(currentState);
  }, []);

  /**
   * Connect to wallet
   */
  const connect = useCallback(async (walletId?: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const newState = await stellarWalletService.connect(walletId);
      setState(newState);
      toast.success('Wallet connected successfully!');
      return newState;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect wallet';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    stellarWalletService.disconnect();
    setState({
      publicKey: null,
      isConnected: false,
      walletId: null,
    });
    toast.success('Wallet disconnected');
  }, []);

  /**
   * Sign a message
   */
  const signMessage = useCallback(async (message: string) => {
    try {
      const signature = await stellarWalletService.signMessage(message);
      return signature;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sign message';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  /**
   * Get account details
   */
  const getAccount = useCallback(async (publicKey?: string) => {
    try {
      return await stellarWalletService.getAccount(publicKey);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get account';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  return {
    // State
    publicKey: state.publicKey,
    isConnected: state.isConnected,
    walletId: state.walletId,
    isConnecting,
    error,

    // Actions
    connect,
    disconnect,
    signMessage,
    getAccount,
  };
}

/**
 * useNFTContract Hook
 *
 * Hook for interacting with NFT contracts
 */
export function useNFTContract(contractId: string) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Mint NFT
   */
  const mint = useCallback(async (
    to: string,
    tokenId: number,
    metadata: NFTMetadata
  ) => {
    setIsLoading(true);
    try {
      const result = await stellarWalletService.mintNFT(
        contractId,
        to,
        tokenId,
        metadata
      );
      toast.success(result);
      return result;
    } catch (err: any) {
      toast.error(err.message || 'Mint failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  /**
   * Transfer NFT
   */
  const transfer = useCallback(async (
    from: string,
    to: string,
    tokenId: number
  ) => {
    setIsLoading(true);
    try {
      const result = await stellarWalletService.transferNFT(
        contractId,
        from,
        to,
        tokenId
      );
      toast.success(result);
      return result;
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  /**
   * Approve NFT
   */
  const approve = useCallback(async (
    to: string,
    tokenId: number
  ) => {
    setIsLoading(true);
    try {
      await stellarWalletService.approveNFT(contractId, to, tokenId);
      toast.success('NFT approved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  /**
   * Get NFT owner
   */
  const getOwner = useCallback(async (tokenId: number) => {
    try {
      return await stellarWalletService.getNFTOwner(contractId, tokenId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get owner');
      throw err;
    }
  }, [contractId]);

  /**
   * Get NFT metadata
   */
  const getMetadata = useCallback(async (tokenId: number) => {
    try {
      return await stellarWalletService.getNFTMetadata(contractId, tokenId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get metadata');
      throw err;
    }
  }, [contractId]);

  return {
    isLoading,
    mint,
    transfer,
    approve,
    getOwner,
    getMetadata,
  };
}

/**
 * useMarketplace Hook
 *
 * Hook for interacting with marketplace contract
 */
export function useMarketplace(marketplaceContractId: string) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Create listing
   */
  const createListing = useCallback(async (
    nftContractId: string,
    tokenId: number,
    price: string,
    expiresAt?: number
  ) => {
    setIsLoading(true);
    try {
      const listingId = await stellarWalletService.createListing(
        marketplaceContractId,
        nftContractId,
        tokenId,
        price,
        expiresAt
      );
      toast.success(`Listing created with ID: ${listingId}`);
      return listingId;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [marketplaceContractId]);

  /**
   * Buy NFT
   */
  const buy = useCallback(async (listingId: number) => {
    setIsLoading(true);
    try {
      await stellarWalletService.buyNFT(marketplaceContractId, listingId);
      toast.success('NFT purchased successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [marketplaceContractId]);

  return {
    isLoading,
    createListing,
    buy,
  };
}
