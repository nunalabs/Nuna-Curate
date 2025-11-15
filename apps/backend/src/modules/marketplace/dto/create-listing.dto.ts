import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ description: 'NFT ID to list' })
  @IsString()
  @IsNotEmpty()
  nftId: string;

  @ApiProperty({ description: 'Price in XLM (stroops)' })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiPropertyOptional({ description: 'Listing expiration date' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
