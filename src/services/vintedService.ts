import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { RateLimiter } from 'limiter';

interface VintedItem {
  id: number;
  title: string;
  price: number;
  url: string;
  photos: string[];
  brand_title?: string;
  size_title?: string;
  user: {
    id: number;
    login: string;
  };
}

interface SearchParams {
  search_text?: string;
  catalog_ids?: string;
  color_ids?: string;
  brand_ids?: string;
  size_ids?: string;
  material_ids?: string;
  status_ids?: string;
  price_from?: number;
  price_to?: number;
  currency?: string;
  order?: 'newest_first' | 'price_high_to_low' | 'price_low_to_high';
}

interface SearchResponse {
  items: VintedItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_entries: number;
    per_page: number;
  };
}

export class VintedAPI {
  private axios: AxiosInstance;
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 20,
      interval: 60 * 1000 // 1 minute in milliseconds
    });

    const proxyConfig = process.env.PROXY_URL ? {
      protocol: 'http',
      host: process.env.PROXY_URL,
      port: 80,
      auth: process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD ? {
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
      } : undefined
    } : undefined;

    this.axios = axios.create({
      baseURL: 'https://www.vinted.com/api/v2',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.vinted.fr/',
        'Origin': 'https://www.vinted.fr'
      },
      proxy: proxyConfig,
      timeout: 10000
    });
  }

  async searchItems(params: SearchParams, page = 1, perPage = 100): Promise<SearchResponse> {
    try {
      await this.rateLimiter.removeTokens(1);
      
      const response = await this.axios.get('/items', {
        params: {
          ...params,
          page,
          per_page: perPage
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Vinted API request failed', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          params
        });

        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
      }
      throw error;
    }
  }

  async getItemDetails(itemId: number): Promise<VintedItem> {
    try {
      await this.rateLimiter.removeTokens(1);
      
      const response = await this.axios.get(`/items/${itemId}`);
      return response.data.item;
    } catch (error) {
      logger.error('Failed to fetch item details', {
        itemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
} 