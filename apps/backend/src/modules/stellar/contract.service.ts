import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarService } from './stellar.service';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private readonly contracts: {
    nftTemplate?: string;
    marketplace?: string;
    royalty?: string;
    factory?: string;
  };

  constructor(
    private stellarService: StellarService,
    private configService: ConfigService,
  ) {
    this.contracts = {
      nftTemplate: this.configService.get('stellar.contracts.nftTemplate'),
      marketplace: this.configService.get('stellar.contracts.marketplace'),
      royalty: this.configService.get('stellar.contracts.royalty'),
      factory: this.configService.get('stellar.contracts.factory'),
    };

    this.logger.log('Contract addresses loaded:', this.contracts);
  }

  /**
   * Get contract address by type
   */
  getContractAddress(
    contractType: 'nftTemplate' | 'marketplace' | 'royalty' | 'factory',
  ): string {
    const address = this.contracts[contractType];
    if (!address) {
      throw new Error(`Contract address not configured for ${contractType}`);
    }
    return address;
  }

  /**
   * Call contract method (read-only)
   */
  async callContract(
    contractId: string,
    method: string,
    params: StellarSdk.xdr.ScVal[] = [],
  ): Promise<any> {
    try {
      // In production, this would build and simulate a transaction
      // to read contract state without submitting to the network

      // Placeholder for actual implementation
      this.logger.log(`Calling contract ${contractId}.${method}`);

      // Actual implementation would look like:
      /*
      const contract = new StellarSdk.Contract(contractId);
      const operation = contract.call(method, ...params);
      const transaction = new StellarSdk.TransactionBuilder(...)
        .addOperation(operation)
        .build();

      const simulation = await this.stellarService.simulateTransaction(
        transaction.toXDR()
      );

      return StellarSdk.scValToNative(simulation.result.retval);
      */

      return null;
    } catch (error) {
      this.logger.error(`Contract call failed: ${contractId}.${method}`, error);
      throw error;
    }
  }

  /**
   * Prepare transaction for contract invocation
   */
  async prepareContractTransaction(
    sourceAccount: string,
    contractId: string,
    method: string,
    params: StellarSdk.xdr.ScVal[] = [],
  ): Promise<string> {
    try {
      const account = await this.stellarService.getAccount(sourceAccount);
      if (!account) {
        throw new Error('Source account not found');
      }

      const contract = new StellarSdk.Contract(contractId);
      const operation = contract.call(method, ...params);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.stellarService.getNetworkPassphrase(),
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate to get resource fees
      const simulation = await this.stellarService.simulateTransaction(
        transaction.toXDR(),
      );

      if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulation)) {
        throw new Error('Transaction simulation failed');
      }

      // Prepare transaction with simulated resources
      const preparedTransaction =
        StellarSdk.SorobanRpc.assembleTransaction(
          transaction,
          simulation,
        ).build();

      return preparedTransaction.toXDR();
    } catch (error) {
      this.logger.error('Failed to prepare contract transaction', error);
      throw error;
    }
  }

  /**
   * Get NFT owner from contract
   */
  async getNFTOwner(
    collectionAddress: string,
    tokenId: string,
  ): Promise<string | null> {
    try {
      const tokenIdParam = StellarSdk.nativeToScVal(
        BigInt(tokenId),
        { type: 'u64' },
      );

      return await this.callContract(
        collectionAddress,
        'owner_of',
        [tokenIdParam],
      );
    } catch (error) {
      this.logger.error('Failed to get NFT owner', error);
      return null;
    }
  }

  /**
   * Get listing info from marketplace
   */
  async getListingInfo(listingId: string): Promise<any> {
    try {
      const marketplaceAddress = this.getContractAddress('marketplace');
      const listingIdParam = StellarSdk.nativeToScVal(
        BigInt(listingId),
        { type: 'u64' },
      );

      return await this.callContract(
        marketplaceAddress,
        'get_listing',
        [listingIdParam],
      );
    } catch (error) {
      this.logger.error('Failed to get listing info', error);
      return null;
    }
  }

  /**
   * Prepare mint NFT transaction
   */
  async prepareMintTransaction(
    sourceAccount: string,
    collectionAddress: string,
    to: string,
    tokenId: string,
    metadataUri: string,
  ): Promise<string> {
    const params = [
      StellarSdk.Address.fromString(to).toScVal(),
      StellarSdk.nativeToScVal(BigInt(tokenId), { type: 'u64' }),
      StellarSdk.nativeToScVal(metadataUri, { type: 'string' }),
    ];

    return await this.prepareContractTransaction(
      sourceAccount,
      collectionAddress,
      'mint',
      params,
    );
  }

  /**
   * Prepare create listing transaction
   */
  async prepareCreateListingTransaction(
    sourceAccount: string,
    nftContract: string,
    tokenId: string,
    price: string,
  ): Promise<string> {
    const marketplaceAddress = this.getContractAddress('marketplace');

    const params = [
      StellarSdk.Address.fromString(nftContract).toScVal(),
      StellarSdk.nativeToScVal(BigInt(tokenId), { type: 'u64' }),
      StellarSdk.Address.fromString(sourceAccount).toScVal(),
      StellarSdk.nativeToScVal(BigInt(price), { type: 'i128' }),
      StellarSdk.nativeToScVal(null),
    ];

    return await this.prepareContractTransaction(
      sourceAccount,
      marketplaceAddress,
      'create_listing',
      params,
    );
  }
}
