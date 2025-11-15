import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NFTController } from './nft.controller';
import { NFTService } from './nft.service';
import { NFT } from './entities/nft.entity';
import { Collection } from '../collections/entities/collection.entity';
import { StorageModule } from '../storage/storage.module';
import { StellarModule } from '../stellar/stellar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NFT, Collection]),
    StorageModule,
    StellarModule,
  ],
  controllers: [NFTController],
  providers: [NFTService],
  exports: [NFTService],
})
export class NFTModule {}
