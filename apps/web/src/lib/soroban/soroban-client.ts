/**
 * Soroban RPC Client
 *
 * Connects directly to Stellar RPC to query smart contracts
 * Used for real-time blockchain data without backend dependency
 */

import { Contract, SorobanRpc, xdr, scValToNative, nativeToScVal } from '@stellar/stellar-sdk';

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NFT_CONTRACT_ID = process.env.NEXT_PUBLIC_NFT_CONTRACT_ID || '';
const MARKETPLACE_CONTRACT_ID = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID || '';

export class SorobanClient {
  private rpc: SorobanRpc.Server;

  constructor() {
    this.rpc = new SorobanRpc.Server(RPC_URL);
  }

  /**
   * Get NFT contract address
   */
  getNFTContractId(): string {
    return NFT_CONTRACT_ID;
  }

  /**
   * Get marketplace contract address
   */
  getMarketplaceContractId(): string {
    return MARKETPLACE_CONTRACT_ID;
  }

  /**
   * Call contract method (read-only)
   */
  private async callContract(
    contractId: string,
    method: string,
    params: xdr.ScVal[] = []
  ): Promise<any> {
    if (!contractId) {
      console.warn(`Contract ID not configured for method ${method}`);
      return null;
    }

    try {
      const contract = new Contract(contractId);

      // Build the operation
      const operation = contract.call(method, ...params);

      // In a read-only call, we would typically simulate the transaction
      // For now, we'll return null as contracts need to be deployed
      console.log(`Calling ${contractId}.${method}`, params);

      // TODO: Implement actual contract simulation when contracts are deployed
      return null;
    } catch (error) {
      console.error(`Contract call failed: ${method}`, error);
      return null;
    }
  }

  /**
   * Get NFT collection info
   */
  async getCollectionInfo(): Promise<{
    name: string;
    symbol: string;
    totalSupply: number;
  } | null> {
    try {
      const name = await this.callContract(NFT_CONTRACT_ID, 'name', []);
      const symbol = await this.callContract(NFT_CONTRACT_ID, 'symbol', []);
      const totalSupply = await this.callContract(NFT_CONTRACT_ID, 'total_supply', []);

      if (!name || !symbol || totalSupply === null) {
        return null;
      }

      return {
        name: scValToNative(name),
        symbol: scValToNative(symbol),
        totalSupply: scValToNative(totalSupply),
      };
    } catch (error) {
      console.error('Failed to get collection info', error);
      return null;
    }
  }

  /**
   * Get NFT metadata by token ID
   */
  async getNFTMetadata(tokenId: number): Promise<{
    name: string;
    description: string;
    imageUri: string;
    metadataUri: string;
  } | null> {
    try {
      const tokenIdParam = nativeToScVal(tokenId, { type: 'u64' });
      const metadata = await this.callContract(
        NFT_CONTRACT_ID,
        'get_metadata',
        [tokenIdParam]
      );

      if (!metadata) {
        return null;
      }

      return scValToNative(metadata);
    } catch (error) {
      console.error(`Failed to get NFT metadata for token ${tokenId}`, error);
      return null;
    }
  }

  /**
   * Get owner of NFT by token ID
   */
  async getOwnerOf(tokenId: number): Promise<string | null> {
    try {
      const tokenIdParam = nativeToScVal(tokenId, { type: 'u64' });
      const owner = await this.callContract(
        NFT_CONTRACT_ID,
        'owner_of',
        [tokenIdParam]
      );

      if (!owner) {
        return null;
      }

      return scValToNative(owner);
    } catch (error) {
      console.error(`Failed to get owner for token ${tokenId}`, error);
      return null;
    }
  }

  /**
   * Get all NFTs owned by an address
   */
  async getNFTsByOwner(ownerAddress: string): Promise<number[] | null> {
    try {
      const ownerParam = nativeToScVal(ownerAddress, { type: 'address' });
      const balance = await this.callContract(
        NFT_CONTRACT_ID,
        'balance_of',
        [ownerParam]
      );

      if (balance === null) {
        return null;
      }

      const balanceNum = scValToNative(balance);
      const tokenIds: number[] = [];

      // Get each token ID owned by the address
      for (let i = 0; i < balanceNum; i++) {
        const indexParam = nativeToScVal(i, { type: 'u32' });
        const tokenId = await this.callContract(
          NFT_CONTRACT_ID,
          'token_of_owner_by_index',
          [ownerParam, indexParam]
        );

        if (tokenId !== null) {
          tokenIds.push(scValToNative(tokenId));
        }
      }

      return tokenIds;
    } catch (error) {
      console.error(`Failed to get NFTs for owner ${ownerAddress}`, error);
      return null;
    }
  }

  /**
   * Get marketplace listing by listing ID
   */
  async getListing(listingId: number): Promise<{
    seller: string;
    nftContract: string;
    tokenId: number;
    price: bigint;
    active: boolean;
  } | null> {
    try {
      const listingIdParam = nativeToScVal(listingId, { type: 'u64' });
      const listing = await this.callContract(
        MARKETPLACE_CONTRACT_ID,
        'get_listing',
        [listingIdParam]
      );

      if (!listing) {
        return null;
      }

      return scValToNative(listing);
    } catch (error) {
      console.error(`Failed to get listing ${listingId}`, error);
      return null;
    }
  }

  /**
   * Get all active listings
   */
  async getActiveListings(): Promise<any[] | null> {
    try {
      const listings = await this.callContract(
        MARKETPLACE_CONTRACT_ID,
        'get_active_listings',
        []
      );

      if (!listings) {
        return null;
      }

      return scValToNative(listings);
    } catch (error) {
      console.error('Failed to get active listings', error);
      return null;
    }
  }

  /**
   * Check if contracts are deployed and accessible
   */
  async checkHealth(): Promise<{
    nftContract: boolean;
    marketplaceContract: boolean;
  }> {
    const nftHealth = NFT_CONTRACT_ID !== '' && await this.getCollectionInfo() !== null;
    const marketplaceHealth = MARKETPLACE_CONTRACT_ID !== '' && await this.getActiveListings() !== null;

    return {
      nftContract: nftHealth,
      marketplaceContract: marketplaceHealth,
    };
  }
}

// Singleton instance
export const sorobanClient = new SorobanClient();
