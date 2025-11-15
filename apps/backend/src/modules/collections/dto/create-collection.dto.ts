import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Collection description' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ description: 'Collection symbol' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({ description: 'Default royalty percentage (0-10)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  royaltyPercentage?: number;

  @ApiPropertyOptional({ description: 'External URL' })
  @IsString()
  @IsOptional()
  externalUrl?: string;
}
