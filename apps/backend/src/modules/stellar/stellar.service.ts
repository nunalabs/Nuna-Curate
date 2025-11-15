import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { STELLAR_NETWORKS } from '@nuna-curate/shared';

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: StellarSdk.SorobanRpc.Server;
  private readonly networkPassphrase: string;

  constructor(private configService: ConfigService) {
    const network = this.configService.get('stellar.network', 'testnet');
    const rpcUrl = this.configService.get('stellar.sorobanRpcUrl');

    this.server = new StellarSdk.SorobanRpc.Server(rpcUrl);
    this.networkPassphrase = STELLAR_NETWORKS[network].networkPassphrase;

    this.logger.log(`Initialized Stellar service for ${network}`);
    this.logger.log(`RPC URL: ${rpcUrl}`);
  }

  /**
   * Get Soroban RPC server instance
   */
  getServer(): StellarSdk.SorobanRpc.Server {
    return this.server;
  }

  /**
   * Get network passphrase
   */
  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  /**
   * Verify a signature from wallet
   * Handles both raw message signatures and transaction signatures
   */
  verifySignature(
    publicKey: string,
    message: string,
    signature: string,
  ): boolean {
    try {
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);

      // Try to decode the signature
      let signatureBuffer: Buffer;
      try {
        // First try base64 decoding
        signatureBuffer = Buffer.from(signature, 'base64');
      } catch {
        // If that fails, try hex decoding
        signatureBuffer = Buffer.from(signature, 'hex');
      }

      // Create a hash of the message (wallet usually signs the hash)
      const messageBuffer = Buffer.from(message, 'utf8');
      const hash = StellarSdk.hash(messageBuffer);

      // Try to verify with the hash first (most common for wallets)
      if (keypair.verify(hash, signatureBuffer)) {
        return true;
      }

      // Fallback: try to verify with raw message
      if (keypair.verify(messageBuffer, signatureBuffer)) {
        return true;
      }

      this.logger.warn(`Signature verification failed for key: ${publicKey}`);
      return false;
    } catch (error) {
      this.logger.error('Signature verification error', error);
      return false;
    }
  }

  /**
   * Generate authentication challenge
   */
  generateChallenge(): string {
    return Buffer.from(
      `Nuna Curate Authentication ${Date.now()} ${Math.random()}`,
    ).toString('base64');
  }

  /**
   * Validate Stellar address
   */
  isValidAddress(address: string): boolean {
    try {
      StellarSdk.StrKey.decodeEd25519PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate contract address
   */
  isValidContractAddress(address: string): boolean {
    try {
      StellarSdk.StrKey.decodeContract(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get account info
   */
  async getAccount(publicKey: string): Promise<StellarSdk.Account | null> {
    try {
      const horizon = new StellarSdk.Horizon.Server(
        this.configService.get('stellar.horizonUrl'),
      );
      const account = await horizon.loadAccount(publicKey);
      return account;
    } catch (error) {
      this.logger.error(`Failed to load account ${publicKey}`, error);
      return null;
    }
  }

  /**
   * Submit transaction
   */
  async submitTransaction(
    xdr: string,
  ): Promise<StellarSdk.SorobanRpc.Api.SendTransactionResponse> {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        this.networkPassphrase,
      );

      const response = await this.server.sendTransaction(
        transaction as StellarSdk.Transaction,
      );

      this.logger.log(`Transaction submitted: ${response.hash}`);

      return response;
    } catch (error) {
      this.logger.error('Transaction submission failed', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransaction(
    hash: string,
  ): Promise<StellarSdk.SorobanRpc.Api.GetTransactionResponse> {
    return await this.server.getTransaction(hash);
  }

  /**
   * Simulate transaction
   */
  async simulateTransaction(
    xdr: string,
  ): Promise<StellarSdk.SorobanRpc.Api.SimulateTransactionResponse> {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        this.networkPassphrase,
      );

      const response = await this.server.simulateTransaction(
        transaction as StellarSdk.Transaction,
      );

      return response;
    } catch (error) {
      this.logger.error('Transaction simulation failed', error);
      throw error;
    }
  }

  /**
   * Get latest ledger
   */
  async getLatestLedger(): Promise<StellarSdk.SorobanRpc.Api.GetLatestLedgerResponse> {
    return await this.server.getLatestLedger();
  }

  /**
   * Get events from contract
   */
  async getEvents(
    contractId: string,
    topics?: string[],
    startLedger?: number,
  ): Promise<StellarSdk.SorobanRpc.Api.GetEventsResponse> {
    const latestLedger = await this.getLatestLedger();
    const start = startLedger || latestLedger.sequence - 1000;

    const filter: StellarSdk.SorobanRpc.Api.EventFilter = {
      type: 'contract',
      contractIds: [contractId],
    };

    if (topics && topics.length > 0) {
      filter.topics = [topics];
    }

    return await this.server.getEvents({
      filters: [filter],
      startLedger: start,
    });
  }
}
