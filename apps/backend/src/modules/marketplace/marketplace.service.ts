import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { NFTService } from '../nft/nft.service';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    private readonly nftService: NFTService,
  ) {}

  async createListing(userId: string, createListingDto: CreateListingDto) {
    const nft = await this.nftService.findOne(createListingDto.nftId);

    // Verify user owns the NFT
    if (nft.owner.id !== userId) {
      throw new ForbiddenException('You do not own this NFT');
    }

    // Check if already listed
    const existingListing = await this.listingRepository.findOne({
      where: {
        nft: { id: createListingDto.nftId },
        status: 'active',
        cancelledAt: IsNull(),
        soldAt: IsNull(),
      },
    });

    if (existingListing) {
      throw new BadRequestException('NFT is already listed');
    }

    const listing = this.listingRepository.create({
      nft,
      seller: { id: userId } as any,
      price: createListingDto.price,
      expiresAt: createListingDto.expiresAt ? new Date(createListingDto.expiresAt) : null,
      status: 'active',
    });

    return this.listingRepository.save(listing);
  }

  async findAll(filters?: {
    sellerId?: string;
    collectionId?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const query = this.listingRepository.createQueryBuilder('listing')
      .leftJoinAndSelect('listing.nft', 'nft')
      .leftJoinAndSelect('nft.collection', 'collection')
      .leftJoinAndSelect('listing.seller', 'seller')
      .where('listing.status = :status', { status: filters?.status || 'active' });

    if (filters?.sellerId) {
      query.andWhere('listing.sellerId = :sellerId', {
        sellerId: filters.sellerId,
      });
    }

    if (filters?.collectionId) {
      query.andWhere('nft.collectionId = :collectionId', {
        collectionId: filters.collectionId,
      });
    }

    if (filters?.minPrice) {
      query.andWhere('listing.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice) {
      query.andWhere('listing.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    const [listings, total] = await query
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy('listing.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: listings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['nft', 'nft.collection', 'seller', 'buyer'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async cancelListing(id: string, userId: string) {
    const listing = await this.findOne(id);

    if (listing.seller.id !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    if (listing.status !== 'active') {
      throw new BadRequestException('Listing is not active');
    }

    listing.status = 'cancelled';
    listing.cancelledAt = new Date();

    return this.listingRepository.save(listing);
  }

  async completeSale(id: string, buyerId: string, txHash: string) {
    const listing = await this.findOne(id);

    if (listing.status !== 'active') {
      throw new BadRequestException('Listing is not active');
    }

    // Update listing
    listing.status = 'sold';
    listing.soldAt = new Date();
    listing.buyer = { id: buyerId } as any;
    listing.transactionHash = txHash;

    await this.listingRepository.save(listing);

    // Update NFT owner
    await this.nftService.updateOwner(listing.nft.id, buyerId);

    return listing;
  }

  async getMarketplaceStats() {
    const [totalListings, activeListings] = await Promise.all([
      this.listingRepository.count(),
      this.listingRepository.count({ where: { status: 'active' } }),
    ]);

    // TODO: Calculate actual volume and sales
    return {
      totalListings,
      activeListings,
      totalVolume: '0',
      totalSales: 0,
    };
  }
}
