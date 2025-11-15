import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NFTAttributeDto {
  @ApiProperty()
  @IsString()
  trait_type: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class CreateNFTDto {
  @ApiProperty({ description: 'NFT name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'NFT description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Collection ID' })
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @ApiPropertyOptional({ description: 'Royalty percentage (0-10)', minimum: 0, maximum: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  royaltyPercentage?: number;

  @ApiPropertyOptional({ description: 'NFT attributes' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NFTAttributeDto)
  attributes?: NFTAttributeDto[];

  @ApiPropertyOptional({ description: 'External URL' })
  @IsString()
  @IsOptional()
  externalUrl?: string;
}
