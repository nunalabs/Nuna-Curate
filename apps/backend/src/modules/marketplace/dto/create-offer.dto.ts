import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ description: 'Listing ID or NFT ID' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ description: 'Offer type: listing or nft' })
  @IsString()
  @IsNotEmpty()
  type: 'listing' | 'nft';

  @ApiProperty({ description: 'Offer price in XLM (stroops)' })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiPropertyOptional({ description: 'Offer expiration date' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
