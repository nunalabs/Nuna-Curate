import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { NFT } from '../../nft/entities/nft.entity';
import { Collection } from '../../collections/entities/collection.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 56 })
  @Index()
  walletAddress: string;

  @Column({ unique: true, nullable: true, length: 30 })
  @Index()
  username?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  bannerUrl?: string;

  @Column({ nullable: true, length: 50 })
  twitterHandle?: string;

  @Column({ nullable: true, length: 50 })
  instagramHandle?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => NFT, (nft) => nft.owner)
  nftsOwned: NFT[];

  @OneToMany(() => NFT, (nft) => nft.creator)
  nftsCreated: NFT[];

  @OneToMany(() => Collection, (collection) => collection.creator)
  collections: Collection[];
}
