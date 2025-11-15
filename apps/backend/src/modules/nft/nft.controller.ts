import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { NFTService } from './nft.service';
import { CreateNFTDto } from './dto/create-nft.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('nfts')
@Controller('nfts')
export class NFTController {
  constructor(private readonly nftService: NFTService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new NFT' })
  @ApiResponse({ status: 201, description: 'NFT created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createNFTDto: CreateNFTDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.nftService.create(userId, createNFTDto, file);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all NFTs' })
  @ApiResponse({ status: 200, description: 'NFTs retrieved successfully' })
  async findAll(
    @Query('collectionId') collectionId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.nftService.findAll({
      collectionId,
      creatorId,
      ownerId,
      status,
      page,
      limit,
    });
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending NFTs' })
  @ApiResponse({ status: 200, description: 'Trending NFTs retrieved' })
  async getTrending(@Query('limit') limit = 10) {
    return this.nftService.getTrending(+limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get NFT by ID' })
  @ApiResponse({ status: 200, description: 'NFT found' })
  @ApiResponse({ status: 404, description: 'NFT not found' })
  async findOne(@Param('id') id: string) {
    return this.nftService.findOne(id);
  }
}
