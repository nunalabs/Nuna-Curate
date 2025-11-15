import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new listing' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  async createListing(
    @CurrentUser('id') userId: string,
    @Body() createListingDto: CreateListingDto,
  ) {
    return this.marketplaceService.createListing(userId, createListingDto);
  }

  @Get('listings')
  @Public()
  @ApiOperation({ summary: 'Get all listings' })
  @ApiResponse({ status: 200, description: 'Listings retrieved' })
  async findAllListings(
    @Query('sellerId') sellerId?: string,
    @Query('collectionId') collectionId?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.marketplaceService.findAll({
      sellerId,
      collectionId,
      status,
      minPrice,
      maxPrice,
      page,
      limit,
    });
  }

  @Get('listings/:id')
  @Public()
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing found' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOneListing(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Put('listings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel listing' })
  @ApiResponse({ status: 200, description: 'Listing cancelled' })
  async cancelListing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.marketplaceService.cancelListing(id, userId);
  }

  @Post('listings/:id/buy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buy NFT from listing' })
  @ApiResponse({ status: 200, description: 'Purchase completed' })
  async buyListing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('txHash') txHash: string,
  ) {
    return this.marketplaceService.completeSale(id, userId, txHash);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get marketplace statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats() {
    return this.marketplaceService.getMarketplaceStats();
  }
}
