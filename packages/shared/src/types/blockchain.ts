/**
 * Blockchain and Stellar/Soroban specific types
 */

export interface StellarNetwork {
  name: string;
  networkPassphrase: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
}

export const STELLAR_NETWORKS: Record<string, StellarNetwork> = {
  testnet: {
    name: 'Testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  },
  mainnet: {
    name: 'Mainnet',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
  },
};

export interface ContractAddresses {
  nft: string;
  marketplace: string;
  auction: string;
  royalty: string;
  collectionFactory: string;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  ledger: number;
  createdAt: string;
}

export interface ContractCall {
  contractId: string;
  method: string;
  params: unknown[];
}

export interface WalletConnection {
  walletType: 'freighter' | 'albedo' | 'xbull' | 'lobstr';
  publicKey: string;
  isConnected: boolean;
}

export interface SignatureRequest {
  message: string;
  publicKey: string;
}

export interface SignatureResponse {
  signature: string;
  publicKey: string;
}

export interface PreparedTransaction {
  xdr: string;
  networkPassphrase: string;
  description: string;
}

export interface BlockchainEvent {
  eventType: string;
  contractId: string;
  ledger: number;
  txHash: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface GasEstimate {
  estimatedFee: string;
  estimatedGas: number;
}
