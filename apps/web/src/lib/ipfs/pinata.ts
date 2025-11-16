/**
 * IPFS/Pinata Upload Service
 *
 * Handles uploading images and metadata to IPFS via Pinata
 */

import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface NFTMetadataInput {
  name: string;
  description: string;
  image: string; // IPFS hash or URL
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
  properties?: Record<string, any>;
}

class PinataService {
  private headers: Record<string, string>;

  constructor() {
    // Prefer JWT authentication
    if (PINATA_JWT) {
      this.headers = {
        Authorization: `Bearer ${PINATA_JWT}`,
      };
    } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      this.headers = {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      };
    } else {
      console.warn('Pinata credentials not configured');
      this.headers = {};
    }
  }

  /**
   * Test Pinata connection
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${PINATA_API_URL}/data/testAuthentication`,
        { headers: this.headers }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Pinata authentication failed:', error);
      return false;
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(file: File, options?: {
    name?: string;
    keyvalues?: Record<string, string>;
  }): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata
      const metadata = JSON.stringify({
        name: options?.name || file.name,
        keyvalues: options?.keyvalues || {},
      });
      formData.append('pinataMetadata', metadata);

      // Add options
      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', pinataOptions);

      const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...this.headers,
            'Content-Type': 'multipart/form-data',
          },
          maxBodyLength: Infinity,
        }
      );

      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(
    json: NFTMetadataInput,
    options?: {
      name?: string;
      keyvalues?: Record<string, string>;
    }
  ): Promise<string> {
    try {
      const data = {
        pinataContent: json,
        pinataMetadata: {
          name: options?.name || 'metadata.json',
          keyvalues: options?.keyvalues || {},
        },
        pinataOptions: {
          cidVersion: 1,
        },
      };

      const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        data,
        { headers: this.headers }
      );

      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('JSON upload failed:', error);
      throw new Error(`Failed to upload JSON: ${error.message}`);
    }
  }

  /**
   * Upload NFT with image and metadata
   * Returns metadata IPFS hash
   */
  async uploadNFT(
    imageFile: File,
    metadata: Omit<NFTMetadataInput, 'image'>,
    options?: {
      imageKeyvalues?: Record<string, string>;
      metadataKeyvalues?: Record<string, string>;
    }
  ): Promise<{
    imageHash: string;
    metadataHash: string;
    imageUrl: string;
    metadataUrl: string;
  }> {
    // 1. Upload image first
    const imageHash = await this.uploadFile(imageFile, {
      name: `nft-image-${Date.now()}`,
      keyvalues: {
        type: 'nft-image',
        ...options?.imageKeyvalues,
      },
    });

    const imageUrl = this.getIPFSUrl(imageHash);

    // 2. Create and upload metadata with image reference
    const fullMetadata: NFTMetadataInput = {
      ...metadata,
      image: imageUrl,
    };

    const metadataHash = await this.uploadJSON(fullMetadata, {
      name: `nft-metadata-${Date.now()}`,
      keyvalues: {
        type: 'nft-metadata',
        imageHash,
        ...options?.metadataKeyvalues,
      },
    });

    const metadataUrl = this.getIPFSUrl(metadataHash);

    return {
      imageHash,
      metadataHash,
      imageUrl,
      metadataUrl,
    };
  }

  /**
   * Get IPFS URL from hash
   */
  getIPFSUrl(hash: string): string {
    return `${PINATA_GATEWAY}/ipfs/${hash}`;
  }

  /**
   * Get direct IPFS protocol URL
   */
  getIPFSProtocolUrl(hash: string): string {
    return `ipfs://${hash}`;
  }

  /**
   * Unpin file from IPFS (cleanup)
   */
  async unpin(hash: string): Promise<void> {
    try {
      await axios.delete(
        `${PINATA_API_URL}/pinning/unpin/${hash}`,
        { headers: this.headers }
      );
    } catch (error: any) {
      console.error('Unpin failed:', error);
      throw new Error(`Failed to unpin: ${error.message}`);
    }
  }

  /**
   * List all pins
   */
  async listPins(options?: {
    status?: 'pinned' | 'unpinned';
    pageLimit?: number;
    pageOffset?: number;
    metadata?: Record<string, string>;
  }) {
    try {
      const params = new URLSearchParams();

      if (options?.status) params.append('status', options.status);
      if (options?.pageLimit) params.append('pageLimit', options.pageLimit.toString());
      if (options?.pageOffset) params.append('pageOffset', options.pageOffset.toString());

      if (options?.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          params.append(`metadata[keyvalues][${key}]`, value);
        });
      }

      const response = await axios.get(
        `${PINATA_API_URL}/data/pinList?${params.toString()}`,
        { headers: this.headers }
      );

      return response.data;
    } catch (error: any) {
      console.error('List pins failed:', error);
      throw new Error(`Failed to list pins: ${error.message}`);
    }
  }

  /**
   * Get file from IPFS
   */
  async getFile(hash: string): Promise<any> {
    try {
      const response = await axios.get(this.getIPFSUrl(hash));
      return response.data;
    } catch (error: any) {
      console.error('Get file failed:', error);
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }
}

// Export singleton instance
export const pinataService = new PinataService();

// Export class and types
export { PinataService };
export type { NFTMetadataInput, PinataResponse };
