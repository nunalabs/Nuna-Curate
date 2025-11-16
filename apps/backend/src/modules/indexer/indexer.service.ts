/**
 * Blockchain Indexer Service
 *
 * Indexes Stellar/Soroban blockchain events and syncs with database
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SorobanRpc, xdr } from '@stellar/stellar-sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Entities (you'll need to create these)
// import { NFT } from '../nft/entities/nft.entity';
// import { Listing } from '../marketplace/entities/listing.entity';
// import { Sale } from '../marketplace/entities/sale.entity';

interface ContractEvent {
  type: string;
  contractId: string;
  ledger: number;
  txHash: string;
  topic: string[];
  value: any;
  timestamp: Date;
}

interface IndexerConfig {
  nftContractId: string;
  marketplaceContractId: string;
  startLedger?: number;
  pollInterval?: number; // milliseconds
}

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private rpc: SorobanRpc.Server;
  private isRunning = false;
  private lastIndexedLedger: number;
  private pollInterval: number;
  private config: IndexerConfig;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    // @InjectRepository(NFT)
    // private nftRepository: Repository<NFT>,
    // @InjectRepository(Listing)
    // private listingRepository: Repository<Listing>,
    // @InjectRepository(Sale)
    // private saleRepository: Repository<Sale>,
  ) {
    const rpcUrl = this.configService.get<string>('STELLAR_RPC_URL') ||
      'https://soroban-testnet.stellar.org';

    this.rpc = new SorobanRpc.Server(rpcUrl);

    this.config = {
      nftContractId: this.configService.get<string>('NFT_CONTRACT_ID', ''),
      marketplaceContractId: this.configService.get<string>('MARKETPLACE_CONTRACT_ID', ''),
      startLedger: this.configService.get<number>('INDEXER_START_LEDGER'),
      pollInterval: this.configService.get<number>('INDEXER_POLL_INTERVAL', 5000),
    };

    this.pollInterval = this.config.pollInterval!;
    this.lastIndexedLedger = this.config.startLedger || 0;
  }

  async onModuleInit() {
    this.logger.log('Indexer Service initialized');

    // Get latest ledger if no start ledger specified
    if (!this.lastIndexedLedger) {
      try {
        const latestLedger = await this.rpc.getLatestLedger();
        this.lastIndexedLedger = latestLedger.sequence - 100; // Start 100 ledgers back
        this.logger.log(`Starting from ledger: ${this.lastIndexedLedger}`);
      } catch (error) {
        this.logger.error('Failed to get latest ledger', error);
      }
    }

    // Start indexing
    this.start();
  }

  /**
   * Start the indexer
   */
  start() {
    if (this.isRunning) {
      this.logger.warn('Indexer already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting blockchain indexer');
    this.poll();
  }

  /**
   * Stop the indexer
   */
  stop() {
    this.isRunning = false;
    this.logger.log('Stopping blockchain indexer');
  }

  /**
   * Main polling loop
   */
  private async poll() {
    while (this.isRunning) {
      try {
        await this.indexNewEvents();
      } catch (error) {
        this.logger.error('Indexing error:', error);
      }

      // Wait before next poll
      await this.sleep(this.pollInterval);
    }
  }

  /**
   * Index new events from blockchain
   */
  private async indexNewEvents() {
    try {
      const latestLedger = await this.rpc.getLatestLedger();
      const currentLedger = latestLedger.sequence;

      if (currentLedger <= this.lastIndexedLedger) {
        // No new ledgers
        return;
      }

      this.logger.debug(
        `Indexing ledgers ${this.lastIndexedLedger + 1} to ${currentLedger}`
      );

      // Get events from both contracts
      const nftEvents = await this.getContractEvents(
        this.config.nftContractId,
        this.lastIndexedLedger + 1,
        currentLedger
      );

      const marketplaceEvents = await this.getContractEvents(
        this.config.marketplaceContractId,
        this.lastIndexedLedger + 1,
        currentLedger
      );

      // Process events
      for (const event of nftEvents) {
        await this.processNFTEvent(event);
      }

      for (const event of marketplaceEvents) {
        await this.processMarketplaceEvent(event);
      }

      // Update last indexed ledger
      this.lastIndexedLedger = currentLedger;

      this.logger.log(
        `Indexed ${nftEvents.length + marketplaceEvents.length} events up to ledger ${currentLedger}`
      );
    } catch (error) {
      this.logger.error('Failed to index new events', error);
      throw error;
    }
  }

  /**
   * Get events from a specific contract
   */
  private async getContractEvents(
    contractId: string,
    startLedger: number,
    endLedger?: number
  ): Promise<ContractEvent[]> {
    if (!contractId) return [];

    try {
      const response = await this.rpc.getEvents({
        filters: [
          {
            type: 'contract',
            contractIds: [contractId],
          },
        ],
        startLedger,
        limit: 1000, // Max events per request
      });

      return response.events.map((event: any) => {
        const topic = event.topic.map((t: any) => {
          try {
            return xdr.ScVal.fromXDR(t, 'base64');
          } catch {
            return t;
          }
        });

        return {
          type: topic[0]?.toString() || 'unknown',
          contractId,
          ledger: event.ledger,
          txHash: event.txHash,
          topic,
          value: event.value,
          timestamp: new Date(event.ledgerClosedAt),
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get events for contract ${contractId}`, error);
      return [];
    }
  }

  /**
   * Process NFT contract events
   */
  private async processNFTEvent(event: ContractEvent) {
    this.logger.debug(`Processing NFT event: ${event.type}`);

    try {
      switch (event.type) {
        case 'mint':
        case 'Mint':
          await this.handleMintEvent(event);
          break;

        case 'transfer':
        case 'Transfer':
          await this.handleTransferEvent(event);
          break;

        case 'burn':
        case 'Burn':
          await this.handleBurnEvent(event);
          break;

        case 'approval':
        case 'Approval':
          await this.handleApprovalEvent(event);
          break;

        default:
          this.logger.debug(`Unknown NFT event type: ${event.type}`);
      }

      // Emit event for real-time updates
      this.eventEmitter.emit(`nft.${event.type.toLowerCase()}`, event);
    } catch (error) {
      this.logger.error(`Failed to process NFT event: ${event.type}`, error);
    }
  }

  /**
   * Process Marketplace contract events
   */
  private async processMarketplaceEvent(event: ContractEvent) {
    this.logger.debug(`Processing Marketplace event: ${event.type}`);

    try {
      switch (event.type) {
        case 'listing_created':
        case 'ListingCreated':
          await this.handleListingCreatedEvent(event);
          break;

        case 'listing_cancelled':
        case 'ListingCancelled':
          await this.handleListingCancelledEvent(event);
          break;

        case 'sale':
        case 'Sale':
          await this.handleSaleEvent(event);
          break;

        case 'offer_made':
        case 'OfferMade':
          await this.handleOfferMadeEvent(event);
          break;

        case 'offer_accepted':
        case 'OfferAccepted':
          await this.handleOfferAcceptedEvent(event);
          break;

        default:
          this.logger.debug(`Unknown Marketplace event type: ${event.type}`);
      }

      // Emit event for real-time updates
      this.eventEmitter.emit(`marketplace.${event.type.toLowerCase()}`, event);
    } catch (error) {
      this.logger.error(`Failed to process Marketplace event: ${event.type}`, error);
    }
  }

  /**
   * Handle Mint event
   */
  private async handleMintEvent(event: ContractEvent) {
    // Parse event data
    const [eventName, to, tokenId, metadataUri] = event.topic;

    this.logger.log(`NFT Minted: Token ${tokenId} to ${to}`);

    // Save to database
    // const nft = this.nftRepository.create({
    //   tokenId: Number(tokenId),
    //   owner: to.toString(),
    //   metadataUri: metadataUri.toString(),
    //   contractAddress: event.contractId,
    //   mintTxHash: event.txHash,
    //   mintedAt: event.timestamp,
    // });
    //
    // await this.nftRepository.save(nft);

    // Emit for real-time updates
    this.eventEmitter.emit('nft.minted', {
      tokenId: Number(tokenId),
      owner: to.toString(),
      metadataUri: metadataUri.toString(),
    });
  }

  /**
   * Handle Transfer event
   */
  private async handleTransferEvent(event: ContractEvent) {
    const [eventName, from, to, tokenId] = event.topic;

    this.logger.log(`NFT Transferred: Token ${tokenId} from ${from} to ${to}`);

    // Update owner in database
    // await this.nftRepository.update(
    //   { tokenId: Number(tokenId) },
    //   { owner: to.toString() }
    // );

    this.eventEmitter.emit('nft.transferred', {
      tokenId: Number(tokenId),
      from: from.toString(),
      to: to.toString(),
    });
  }

  /**
   * Handle Burn event
   */
  private async handleBurnEvent(event: ContractEvent) {
    const [eventName, owner, tokenId] = event.topic;

    this.logger.log(`NFT Burned: Token ${tokenId}`);

    // Mark as burned in database
    // await this.nftRepository.update(
    //   { tokenId: Number(tokenId) },
    //   { burned: true, burnedAt: event.timestamp }
    // );

    this.eventEmitter.emit('nft.burned', {
      tokenId: Number(tokenId),
      owner: owner.toString(),
    });
  }

  /**
   * Handle Approval event
   */
  private async handleApprovalEvent(event: ContractEvent) {
    const [eventName, owner, approved, tokenId] = event.topic;

    this.logger.debug(`NFT Approved: Token ${tokenId} to ${approved}`);

    this.eventEmitter.emit('nft.approved', {
      tokenId: Number(tokenId),
      owner: owner.toString(),
      approved: approved.toString(),
    });
  }

  /**
   * Handle ListingCreated event
   */
  private async handleListingCreatedEvent(event: ContractEvent) {
    const [eventName, listingId, seller, nftContract, tokenId, price] = event.topic;

    this.logger.log(`Listing Created: ID ${listingId}, Price ${price}`);

    // Save listing to database
    // const listing = this.listingRepository.create({
    //   listingId: Number(listingId),
    //   seller: seller.toString(),
    //   nftContractAddress: nftContract.toString(),
    //   tokenId: Number(tokenId),
    //   price: BigInt(price.toString()),
    //   status: 'active',
    //   createdAt: event.timestamp,
    // });
    //
    // await this.listingRepository.save(listing);

    this.eventEmitter.emit('marketplace.listing.created', {
      listingId: Number(listingId),
      seller: seller.toString(),
      tokenId: Number(tokenId),
      price: price.toString(),
    });
  }

  /**
   * Handle ListingCancelled event
   */
  private async handleListingCancelledEvent(event: ContractEvent) {
    const [eventName, listingId, seller] = event.topic;

    this.logger.log(`Listing Cancelled: ID ${listingId}`);

    // Update listing status
    // await this.listingRepository.update(
    //   { listingId: Number(listingId) },
    //   { status: 'cancelled', cancelledAt: event.timestamp }
    // );

    this.eventEmitter.emit('marketplace.listing.cancelled', {
      listingId: Number(listingId),
    });
  }

  /**
   * Handle Sale event
   */
  private async handleSaleEvent(event: ContractEvent) {
    const [eventName, listingId, nftContract, tokenId, seller, buyer, price] = event.topic;

    this.logger.log(`Sale Completed: Listing ${listingId}, Price ${price}`);

    // Update listing
    // await this.listingRepository.update(
    //   { listingId: Number(listingId) },
    //   { status: 'sold', soldAt: event.timestamp }
    // );

    // Create sale record
    // const sale = this.saleRepository.create({
    //   listingId: Number(listingId),
    //   seller: seller.toString(),
    //   buyer: buyer.toString(),
    //   tokenId: Number(tokenId),
    //   price: BigInt(price.toString()),
    //   txHash: event.txHash,
    //   soldAt: event.timestamp,
    // });
    //
    // await this.saleRepository.save(sale);

    this.eventEmitter.emit('marketplace.sale.completed', {
      listingId: Number(listingId),
      seller: seller.toString(),
      buyer: buyer.toString(),
      price: price.toString(),
    });
  }

  /**
   * Handle OfferMade event
   */
  private async handleOfferMadeEvent(event: ContractEvent) {
    const [eventName, offerId, buyer, nftContract, tokenId, amount] = event.topic;

    this.logger.log(`Offer Made: ID ${offerId}, Amount ${amount}`);

    this.eventEmitter.emit('marketplace.offer.made', {
      offerId: Number(offerId),
      buyer: buyer.toString(),
      tokenId: Number(tokenId),
      amount: amount.toString(),
    });
  }

  /**
   * Handle OfferAccepted event
   */
  private async handleOfferAcceptedEvent(event: ContractEvent) {
    const [eventName, offerId, seller, buyer, amount] = event.topic;

    this.logger.log(`Offer Accepted: ID ${offerId}`);

    this.eventEmitter.emit('marketplace.offer.accepted', {
      offerId: Number(offerId),
      seller: seller.toString(),
      buyer: buyer.toString(),
    });
  }

  /**
   * Get indexer status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastIndexedLedger: this.lastIndexedLedger,
      config: this.config,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
