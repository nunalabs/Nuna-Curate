import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

export interface UploadResult {
  ipfsHash: string;
  url: string;
  size: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  external_url?: string;
  animation_url?: string;
}

@Injectable()
export class StorageService {
  private readonly pinataApiKey: string;
  private readonly pinataSecretKey: string;
  private readonly pinataJWT: string;
  private readonly pinataGateway = 'https://gateway.pinata.cloud/ipfs/';

  constructor(private readonly configService: ConfigService) {
    this.pinataApiKey = this.configService.get('PINATA_API_KEY');
    this.pinataSecretKey = this.configService.get('PINATA_SECRET_KEY');
    this.pinataJWT = this.configService.get('PINATA_JWT');
  }

  async uploadFile(
    file: Express.Multer.File,
    options?: { name?: string; keyvalues?: Record<string, string> },
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname);

      if (options?.name || options?.keyvalues) {
        const metadata = JSON.stringify({
          name: options?.name || file.originalname,
          keyvalues: options?.keyvalues || {},
        });
        formData.append('pinataMetadata', metadata);
      }

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      return {
        ipfsHash: response.data.IpfsHash,
        url: `${this.pinataGateway}${response.data.IpfsHash}`,
        size: response.data.PinSize,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload file to IPFS: ${error.message}`,
      );
    }
  }

  async uploadJSON(
    data: NFTMetadata | Record<string, any>,
    options?: { name?: string; keyvalues?: Record<string, string> },
  ): Promise<UploadResult> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: {
            name: options?.name || 'metadata.json',
            keyvalues: options?.keyvalues || {},
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        },
      );

      const jsonSize = JSON.stringify(data).length;

      return {
        ipfsHash: response.data.IpfsHash,
        url: `${this.pinataGateway}${response.data.IpfsHash}`,
        size: jsonSize,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload JSON to IPFS: ${error.message}`,
      );
    }
  }

  async uploadNFTMetadata(
    metadata: NFTMetadata,
    imageFile?: Express.Multer.File,
  ): Promise<{ metadataUrl: string; imageUrl?: string }> {
    let imageUrl: string | undefined;

    // Upload image first if provided
    if (imageFile) {
      const imageResult = await this.uploadFile(imageFile, {
        name: `nft-image-${Date.now()}`,
        keyvalues: { type: 'nft-image' },
      });
      imageUrl = imageResult.url;
      metadata.image = imageUrl;
    }

    // Upload metadata
    const metadataResult = await this.uploadJSON(metadata, {
      name: `nft-metadata-${Date.now()}`,
      keyvalues: { type: 'nft-metadata' },
    });

    return {
      metadataUrl: metadataResult.url,
      imageUrl,
    };
  }

  async getFileFromIPFS(ipfsHash: string): Promise<any> {
    try {
      const response = await axios.get(`${this.pinataGateway}${ipfsHash}`);
      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch file from IPFS: ${error.message}`,
      );
    }
  }

  async unpinFile(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        },
      );
    } catch (error) {
      // Silently fail - file might already be unpinned
      console.error(`Failed to unpin file: ${error.message}`);
    }
  }
}
