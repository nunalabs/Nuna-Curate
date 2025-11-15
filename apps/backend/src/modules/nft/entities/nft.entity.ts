import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { Listing } from '../../marketplace/entities/listing.entity';

@Entity('nfts')
export class NFT {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  collectionId: string;

  @Column({ type: 'bigint' })
  @Index()
  tokenId: string;

  @Column({ type: 'uuid' })
  @Index()
  ownerId: string;

  @Column({ type: 'uuid' })
  @Index()
  creatorId: string;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  metadataUri: string;

  @Column({ type: 'jsonb' })
  metadata: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rarityScore?: number;

  @Column({ type: 'int', nullable: true })
  rarityRank?: number;

  @CreateDateColumn()
  mintedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Collection, (collection) => collection.nfts)
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @ManyToOne(() => User, (user) => user.nftsOwned)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToOne(() => User, (user) => user.nftsCreated)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => Listing, (listing) => listing.nft)
  listings: Listing[];
}
