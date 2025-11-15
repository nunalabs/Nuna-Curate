import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NFT } from '../../nft/entities/nft.entity';
import { User } from '../../users/entities/user.entity';
import { ListingStatus } from '@nuna-curate/shared';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  nftId: string;

  @Column({ type: 'uuid' })
  @Index()
  sellerId: string;

  @Column({ type: 'decimal', precision: 20, scale: 7 })
  @Index()
  price: string;

  @Column({ length: 10, default: 'XLM' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  @Index()
  status: ListingStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => NFT, (nft) => nft.listings)
  @JoinColumn({ name: 'nftId' })
  nft: NFT;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller: User;
}
