import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new collection' })
  @ApiResponse({ status: 201, description: 'Collection created' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createCollectionDto: CreateCollectionDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ) {
    return this.collectionsService.create(
      userId,
      createCollectionDto,
      files?.image?.[0],
      files?.banner?.[0],
    );
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all collections' })
  @ApiResponse({ status: 200, description: 'Collections retrieved' })
  async findAll(
    @Query('creatorId') creatorId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.collectionsService.findAll({ creatorId, page, limit });
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending collections' })
  @ApiResponse({ status: 200, description: 'Trending collections retrieved' })
  async getTrending(@Query('limit') limit = 10) {
    return this.collectionsService.getTrending(+limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get collection by ID' })
  @ApiResponse({ status: 200, description: 'Collection found' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Get(':id/stats')
  @Public()
  @ApiOperation({ summary: 'Get collection statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats(@Param('id') id: string) {
    return this.collectionsService.getStats(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update collection' })
  @ApiResponse({ status: 200, description: 'Collection updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: Partial<CreateCollectionDto>,
  ) {
    return this.collectionsService.update(id, userId, updateData);
  }
}
