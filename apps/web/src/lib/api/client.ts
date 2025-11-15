import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class APIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';

        if (error.response?.status === 401) {
          this.clearAuth();
          toast.error('Session expired. Please login again.');
        } else if (error.response?.status === 403) {
          toast.error('Access denied');
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(message);
        }

        return Promise.reject(error);
      },
    );
  }

  setAuth(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  clearAuth() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  loadAuth() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        this.accessToken = token;
      }
    }
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // Auth
  async getNonce() {
    return this.request<{ message: string; timestamp: number }>({
      method: 'POST',
      url: '/auth/nonce',
    });
  }

  async login(publicKey: string, signature: string, message: string) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>({
      method: 'POST',
      url: '/auth/login',
      data: { publicKey, signature, message },
    });

    this.setAuth(response.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async register(data: {
    publicKey: string;
    username: string;
    displayName?: string;
    bio?: string;
  }) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>({
      method: 'POST',
      url: '/auth/register',
      data,
    });

    this.setAuth(response.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  // Users
  async getProfile() {
    return this.request<any>({
      method: 'GET',
      url: '/users/me',
    });
  }

  async updateProfile(data: any) {
    return this.request<any>({
      method: 'PUT',
      url: '/users/me',
      data,
    });
  }

  async getUser(id: string) {
    return this.request<any>({
      method: 'GET',
      url: `/users/${id}`,
    });
  }

  // Collections
  async getCollections(params?: {
    creatorId?: string;
    page?: number;
    limit?: number;
  }) {
    return this.request<{ data: any[]; meta: any }>({
      method: 'GET',
      url: '/collections',
      params,
    });
  }

  async getCollection(id: string) {
    return this.request<any>({
      method: 'GET',
      url: `/collections/${id}`,
    });
  }

  async getTrendingCollections(limit = 10) {
    return this.request<any[]>({
      method: 'GET',
      url: '/collections/trending',
      params: { limit },
    });
  }

  async createCollection(data: FormData) {
    return this.request<any>({
      method: 'POST',
      url: '/collections',
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // NFTs
  async getNFTs(params?: {
    collectionId?: string;
    creatorId?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }) {
    return this.request<{ data: any[]; meta: any }>({
      method: 'GET',
      url: '/nfts',
      params,
    });
  }

  async getNFT(id: string) {
    return this.request<any>({
      method: 'GET',
      url: `/nfts/${id}`,
    });
  }

  async getTrendingNFTs(limit = 10) {
    return this.request<any[]>({
      method: 'GET',
      url: '/nfts/trending',
      params: { limit },
    });
  }

  async createNFT(data: FormData) {
    return this.request<any>({
      method: 'POST',
      url: '/nfts',
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Marketplace
  async getListings(params?: {
    sellerId?: string;
    collectionId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    return this.request<{ data: any[]; meta: any }>({
      method: 'GET',
      url: '/marketplace/listings',
      params,
    });
  }

  async getListing(id: string) {
    return this.request<any>({
      method: 'GET',
      url: `/marketplace/listings/${id}`,
    });
  }

  async createListing(data: { nftId: string; price: string; expiresAt?: string }) {
    return this.request<any>({
      method: 'POST',
      url: '/marketplace/listings',
      data,
    });
  }

  async cancelListing(id: string) {
    return this.request<any>({
      method: 'PUT',
      url: `/marketplace/listings/${id}/cancel`,
    });
  }

  async buyListing(id: string, txHash: string) {
    return this.request<any>({
      method: 'POST',
      url: `/marketplace/listings/${id}/buy`,
      data: { txHash },
    });
  }

  async getMarketplaceStats() {
    return this.request<any>({
      method: 'GET',
      url: '/marketplace/stats',
    });
  }
}

export const apiClient = new APIClient();

// Load auth token on initialization (client-side only)
if (typeof window !== 'undefined') {
  apiClient.loadAuth();
}
