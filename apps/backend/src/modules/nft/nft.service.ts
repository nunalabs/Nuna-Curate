import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NFT } from './entities/nft.entity';
import { CreateNFTDto } from './dto/create-nft.dto';
import { StorageService } from '../storage/storage.service';
import { ContractService } from '../stellar/contract.service';
import { Collection } from '../collections/entities/collection.entity';

@Injectable()
export class NFTService {
  constructor(
    @InjectRepository(NFT)
    private readonly nftRepository: Repository<NFT>,
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    private readonly storageService: StorageService,
    private readonly contractService: ContractService,
  ) {}

  async create(
    userId: string,
    createNFTDto: CreateNFTDto,
    imageFile: Express.Multer.File,
  ) {
    // Verify collection exists and user owns it
    const collection = await this.collectionRepository.findOne({
      where: { id: createNFTDto.collectionId },
      relations: ['creator'],
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.creator.id !== userId) {
      throw new ForbiddenException('You do not own this collection');
    }

    // Upload image and metadata to IPFS
    const metadata = {
      name: createNFTDto.name,
      description: createNFTDto.description,
      image: '', // Will be set by uploadNFTMetadata
      attributes: createNFTDto.attributes || [],
      external_url: createNFTDto.externalUrl,
    };

    const { metadataUrl, imageUrl } = await this.storageService.uploadNFTMetadata(
      metadata,
      imageFile,
    );

    // Create NFT record
    const nft = this.nftRepository.create({
      name: createNFTDto.name,
      description: createNFTDto.description,
      imageUrl: imageUrl!,
      metadataUrl,
      collection,
      creator: { id: userId } as any,
      owner: { id: userId } as any,
      royaltyPercentage: createNFTDto.royaltyPercentage || 0,
      metadata,
    });

    await this.nftRepository.save(nft);

    return nft;
  }

  async findAll(filters?: {
    collectionId?: string;
    creatorId?: string;
    ownerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const query = this.nftRepository.createQueryBuilder('nft')
      .leftJoinAndSelect('nft.collection', 'collection')
      .leftJoinAndSelect('nft.creator', 'creator')
      .leftJoinAndSelect('nft.owner', 'owner');

    if (filters?.collectionId) {
      query.andWhere('nft.collectionId = :collectionId', {
        collectionId: filters.collectionId,
      });
    }

    if (filters?.creatorId) {
      query.andWhere('nft.creatorId = :creatorId', {
        creatorId: filters.creatorId,
      });
    }

    if (filters?.ownerId) {
      query.andWhere('nft.ownerId = :ownerId', {
        ownerId: filters.ownerId,
      });
    }

    if (filters?.status) {
      query.andWhere('nft.status = :status', { status: filters.status });
    }

    const [nfts, total] = await query
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy('nft.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: nfts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const nft = await this.nftRepository.findOne({
      where: { id },
      relations: ['collection', 'creator', 'owner'],
    });

    if (!nft) {
      throw new NotFoundException('NFT not found');
    }

    return nft;
  }

  async findByTokenId(tokenId: string) {
    return this.nftRepository.findOne({
      where: { tokenId },
      relations: ['collection', 'creator', 'owner'],
    });
  }

  async updateOwner(id: string, newOwnerId: string) {
    const nft = await this.findOne(id);
    nft.owner = { id: newOwnerId } as any;
    return this.nftRepository.save(nft);
  }

  async updateContractData(id: string, tokenId: string, contractAddress: string) {
    const nft = await this.findOne(id);
    nft.tokenId = tokenId;
    nft.contractAddress = contractAddress;
    nft.status = 'minted';
    return this.nftRepository.save(nft);
  }

  async getTrending(limit = 10) {
    // TODO: Implement trending logic based on views, sales, etc.
    return this.nftRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['collection', 'creator', 'owner'],
    });
  }
}
