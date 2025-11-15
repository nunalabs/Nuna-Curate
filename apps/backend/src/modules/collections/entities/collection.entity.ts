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
import { NFT } from '../../nft/entities/nft.entity';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 56 })
  @Index()
  contractAddress: string;

  @Column({ type: 'uuid' })
  creatorId: string;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column({ length: 10 })
  symbol: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  bannerUrl?: string;

  @Column({ nullable: true })
  baseUri?: string;

  @Column({ nullable: true, length: 56 })
  royaltyReceiver?: string;

  @Column({ type: 'int', default: 0 })
  royaltyBps: number;

  @Column({ type: 'int', default: 0 })
  totalSupply: number;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.collections)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => NFT, (nft) => nft.collection)
  nfts: NFT[];
}
