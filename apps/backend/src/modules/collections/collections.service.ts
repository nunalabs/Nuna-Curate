import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    userId: string,
    createCollectionDto: CreateCollectionDto,
    imageFile?: Express.Multer.File,
    bannerFile?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    let bannerUrl: string | undefined;

    // Upload image if provided
    if (imageFile) {
      const result = await this.storageService.uploadFile(imageFile, {
        name: `collection-image-${Date.now()}`,
        keyvalues: { type: 'collection-image' },
      });
      imageUrl = result.url;
    }

    // Upload banner if provided
    if (bannerFile) {
      const result = await this.storageService.uploadFile(bannerFile, {
        name: `collection-banner-${Date.now()}`,
        keyvalues: { type: 'collection-banner' },
      });
      bannerUrl = result.url;
    }

    const collection = this.collectionRepository.create({
      ...createCollectionDto,
      imageUrl,
      bannerUrl,
      creator: { id: userId } as any,
    });

    return this.collectionRepository.save(collection);
  }

  async findAll(filters?: {
    creatorId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const query = this.collectionRepository.createQueryBuilder('collection')
      .leftJoinAndSelect('collection.creator', 'creator')
      .loadRelationCountAndMap('collection.nftCount', 'collection.nfts');

    if (filters?.creatorId) {
      query.andWhere('collection.creatorId = :creatorId', {
        creatorId: filters.creatorId,
      });
    }

    const [collections, total] = await query
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy('collection.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: collections,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ['creator', 'nfts'],
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async update(
    id: string,
    userId: string,
    updateData: Partial<CreateCollectionDto>,
  ) {
    const collection = await this.findOne(id);

    if (collection.creator.id !== userId) {
      throw new ForbiddenException('You do not own this collection');
    }

    Object.assign(collection, updateData);
    return this.collectionRepository.save(collection);
  }

  async getTrending(limit = 10) {
    // TODO: Implement trending logic based on volume, sales, etc.
    return this.collectionRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getStats(id: string) {
    const collection = await this.findOne(id);

    // TODO: Calculate actual stats from sales/listings
    return {
      collectionId: id,
      totalNFTs: collection.nfts?.length || 0,
      totalVolume: '0',
      floorPrice: null,
      owners: 0,
      listed: 0,
    };
  }
}
