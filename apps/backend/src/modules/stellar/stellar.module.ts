import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StellarService } from './stellar.service';
import { ContractService } from './contract.service';

@Module({
  imports: [ConfigModule],
  providers: [StellarService, ContractService],
  exports: [StellarService, ContractService],
})
export class StellarModule {}
