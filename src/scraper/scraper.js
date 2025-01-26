import axios from 'axios';
import { PROXY_URL } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { RateLimiter } from 'limiter';

// Create more conservative rate limiter (20 requests per minute)
const limiter = new RateLimiter({
  tokensPerInterval: 20,
  interval: 'minute'
});

// Headers to mimic browser request
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.vinted.fr/',
  'Origin': 'https://www.vinted.fr'
};

// Proxy configuration if available
const axiosInstance = axios.create({
  baseURL: 'https://www.vinted.fr/api/v2',
  headers: DEFAULT_HEADERS,
  ...(PROXY_URL ? { proxy: { host: PROXY_URL } } : {})
});

async function fetchVintedItems(filters, page = 1, perPage = 100) {
  try {
    // Wait for rate limiter
    await limiter.removeTokens(1);
    
    // Build query parameters
    const params = {
      ...filters,
      page,
      per_page: perPage,
      order: filters.order || 'newest_first'
    };

    // Make API request
    const response = await axiosInstance.get('/items', {
      params,
      timeout: 10000 // 10 second timeout
    });

    // Handle pagination
    const { items, pagination } = response.data;
    const totalPages = pagination.total_pages;
    
    // Return results with pagination info
    return {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        hasMore: page < totalPages
      }
    };
    
  } catch (error) {
    logger.error('Vinted API request failed', {
      error: error.message,
      filters,
      page
    });
    
    // Handle specific error cases
    if (error.response) {
      // Vinted API error
      throw new Error(`Vinted API error: ${error.response.status} - ${error.response.data?.message}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error while contacting Vinted API');
    } else {
      // Other errors
      throw error;
    }
  }
}

export { fetchVintedItems };
