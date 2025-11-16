/**
 * Stellar Wallet Service
 *
 * Handles all wallet connections, transactions, and contract interactions
 * Supports Freighter, XBULL, and other Stellar wallets
 */

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
  xBullModule,
} from '@creit.tech/stellar-wallets-kit';
import {
  Address,
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
  xdr,
} from '@stellar/stellar-sdk';

// Types
export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  walletId: string | null;
}

export interface ContractCallParams {
  contractId: string;
  method: string;
  args?: any[];
}

export interface NFTMetadata {
  name: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
}

// Configuration
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';
const RPC_URL = NETWORK === 'TESTNET'
  ? 'https://soroban-testnet.stellar.org'
  : 'https://soroban-mainnet.stellar.org';

const NETWORK_PASSPHRASE = NETWORK === 'TESTNET'
  ? Networks.TESTNET
  : Networks.PUBLIC;

class StellarWalletService {
  private kit: StellarWalletsKit;
  private rpc: SorobanRpc.Server;
  private state: WalletState;

  constructor() {
    // Initialize Stellar Wallets Kit
    this.kit = new StellarWalletsKit({
      network: NETWORK === 'TESTNET' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });

    // Initialize RPC server
    this.rpc = new SorobanRpc.Server(RPC_URL);

    // Initialize state
    this.state = {
      publicKey: null,
      isConnected: false,
      walletId: null,
    };

    // Try to restore previous session
    this.restoreSession();
  }

  /**
   * Restore previous wallet session from localStorage
   */
  private async restoreSession() {
    if (typeof window === 'undefined') return;

    const savedState = localStorage.getItem('stellar_wallet_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.state = parsed;
      } catch (error) {
        console.error('Failed to restore wallet session:', error);
      }
    }
  }

  /**
   * Save wallet state to localStorage
   */
  private saveSession() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('stellar_wallet_state', JSON.stringify(this.state));
  }

  /**
   * Connect to a Stellar wallet
   */
  async connect(walletId?: string): Promise<WalletState> {
    try {
      if (walletId) {
        this.kit.setWallet(walletId);
      }

      await this.kit.openModal({
        onWalletSelected: async (option) => {
          this.kit.setWallet(option.id);
        },
      });

      const { address } = await this.kit.getAddress();

      this.state = {
        publicKey: address,
        isConnected: true,
        walletId: walletId || FREIGHTER_ID,
      };

      this.saveSession();
      return this.state;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new Error('Failed to connect to wallet');
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.state = {
      publicKey: null,
      isConnected: false,
      walletId: null,
    };

    if (typeof window !== 'undefined') {
      localStorage.removeItem('stellar_wallet_state');
    }
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Get account details from blockchain
   */
  async getAccount(publicKey?: string) {
    const address = publicKey || this.state.publicKey;
    if (!address) throw new Error('No wallet connected');

    try {
      const account = await this.rpc.getAccount(address);
      return account;
    } catch (error) {
      console.error('Failed to get account:', error);
      throw error;
    }
  }

  /**
   * Sign a message with the wallet
   */
  async signMessage(message: string): Promise<string> {
    if (!this.state.isConnected || !this.state.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signedMessage } = await this.kit.sign({
        message,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      return signedMessage;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Call a Soroban smart contract method
   */
  async callContract<T = any>(params: ContractCallParams): Promise<T> {
    if (!this.state.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const contract = new Contract(params.contractId);
      const account = await this.getAccount();

      // Build the contract call operation
      const operation = contract.call(
        params.method,
        ...(params.args || [])
      );

      // Build transaction
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate transaction first
      const simulated = await this.rpc.simulateTransaction(tx);

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      // Prepare transaction with simulation results
      const preparedTx = SorobanRpc.assembleTransaction(tx, simulated).build();

      // Sign with wallet
      const { signedTxXdr } = await this.kit.sign({
        xdr: preparedTx.toXDR(),
        publicKey: this.state.publicKey,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      // Submit transaction
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
      const sendResponse = await this.rpc.sendTransaction(signedTx);

      if (sendResponse.status === 'PENDING') {
        // Poll for result
        let getResponse = await this.rpc.getTransaction(sendResponse.hash);
        const retries = 10;
        let attempt = 0;

        while (getResponse.status === 'NOT_FOUND' && attempt++ < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          getResponse = await this.rpc.getTransaction(sendResponse.hash);
        }

        if (getResponse.status === 'SUCCESS') {
          const result = getResponse.returnValue;
          return result as T;
        } else {
          throw new Error(`Transaction failed: ${getResponse.status}`);
        }
      } else {
        throw new Error(`Transaction send failed: ${sendResponse.status}`);
      }
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }

  /**
   * Mint an NFT
   */
  async mintNFT(
    contractId: string,
    to: string,
    tokenId: number,
    metadata: NFTMetadata
  ): Promise<string> {
    try {
      await this.callContract({
        contractId,
        method: 'mint',
        args: [
          new Address(to),
          tokenId,
          metadata,
        ],
      });

      return `NFT #${tokenId} minted successfully`;
    } catch (error) {
      console.error('Mint failed:', error);
      throw error;
    }
  }

  /**
   * Transfer NFT
   */
  async transferNFT(
    contractId: string,
    from: string,
    to: string,
    tokenId: number
  ): Promise<string> {
    try {
      await this.callContract({
        contractId,
        method: 'transfer',
        args: [
          new Address(from),
          new Address(to),
          tokenId,
        ],
      });

      return `NFT #${tokenId} transferred`;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  /**
   * Approve NFT transfer
   */
  async approveNFT(
    contractId: string,
    to: string,
    tokenId: number
  ): Promise<void> {
    if (!this.state.publicKey) throw new Error('Wallet not connected');

    await this.callContract({
      contractId,
      method: 'approve',
      args: [
        new Address(this.state.publicKey),
        new Address(to),
        tokenId,
      ],
    });
  }

  /**
   * Create marketplace listing
   */
  async createListing(
    marketplaceContractId: string,
    nftContractId: string,
    tokenId: number,
    price: string,
    expiresAt?: number
  ): Promise<number> {
    if (!this.state.publicKey) throw new Error('Wallet not connected');

    // First approve the marketplace to transfer the NFT
    await this.approveNFT(nftContractId, marketplaceContractId, tokenId);

    // Then create the listing
    const listingId = await this.callContract<number>({
      contractId: marketplaceContractId,
      method: 'create_listing',
      args: [
        new Address(nftContractId),
        tokenId,
        new Address(this.state.publicKey),
        BigInt(price),
        expiresAt || null,
      ],
    });

    return listingId;
  }

  /**
   * Buy from marketplace
   */
  async buyNFT(
    marketplaceContractId: string,
    listingId: number
  ): Promise<void> {
    if (!this.state.publicKey) throw new Error('Wallet not connected');

    await this.callContract({
      contractId: marketplaceContractId,
      method: 'buy',
      args: [
        listingId,
        new Address(this.state.publicKey),
      ],
    });
  }

  /**
   * Get NFT owner
   */
  async getNFTOwner(contractId: string, tokenId: number): Promise<string> {
    const owner = await this.callContract<Address>({
      contractId,
      method: 'owner_of',
      args: [tokenId],
    });

    return owner.toString();
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(contractId: string, tokenId: number): Promise<NFTMetadata> {
    const metadata = await this.callContract<NFTMetadata>({
      contractId,
      method: 'token_metadata',
      args: [tokenId],
    });

    return metadata;
  }
}

// Export singleton instance
export const stellarWalletService = new StellarWalletService();

// Export class for testing
export { StellarWalletService };
