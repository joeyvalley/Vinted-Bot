const axios = require('axios');
const { PROXY_URL, VINTED_API_KEY } = require('../config/env');
const logger = require('../utils/logger.js');
const { RateLimiter } = require('limiter');

// Create rate limiter (40 requests per minute)
const limiter = new RateLimiter({
  tokensPerInterval: 40,
  interval: 'minute'
});

// Default headers for Vinted API
const DEFAULT_HEADERS = {
  'User-Agent': 'VintedBot/1.0',
  'Accept': 'application/json',
  'Authorization': `Bearer ${VINTED_API_KEY}`
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

module.exports = { fetchVintedItems };
