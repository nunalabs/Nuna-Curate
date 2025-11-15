import { registerAs } from '@nestjs/config';

export const stellarConfig = registerAs('stellar', () => ({
  network: process.env.STELLAR_NETWORK || 'testnet',
  horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: process.env.STELLAR_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  contracts: {
    nftTemplate: process.env.CONTRACT_NFT_TEMPLATE,
    marketplace: process.env.CONTRACT_MARKETPLACE,
    royalty: process.env.CONTRACT_ROYALTY,
    factory: process.env.CONTRACT_FACTORY,
  },
}));
