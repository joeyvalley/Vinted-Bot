import { getCache, setCache } from '../cache/redis.js';
import logger from '../utils/logger.js';
import { fetchVintedItems } from '../scraper/scraper.js';
import { trackEvent } from '../stats/statsTracker.js';

class SearchQuery {
  constructor(userId, params) {
    this.userId = userId;
    this.params = this.validateParams(params);
    this.cacheKey = `search:${userId}:${this.getHash()}`;
  }

  validateParams(params) {
    // Basic validation of search parameters
    if (!params || typeof params !== 'object') {
      throw new Error('Invalid search parameters');
    }
    
    // Ensure required fields are present
    const requiredFields = ['query', 'category'];
    requiredFields.forEach(field => {
      if (!params[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    // Validate and normalize advanced filters
    const validFilters = {
      price: {
        min: { type: 'number', min: 0 },
        max: { type: 'number', min: 0 }
      },
      size: { type: 'string' },
      brand: { type: 'string' },
      condition: { type: 'string', enum: ['new', 'very_good', 'good', 'fair'] },
      color: { type: 'string' },
      location: { type: 'string' },
      order: { 
        type: 'string', 
        enum: ['newest_first', 'price_low_to_high', 'price_high_to_low'] 
      }
    };

    // Validate each filter
    for (const [filter, value] of Object.entries(params)) {
      if (validFilters[filter]) {
        const { type, min, enum: enumValues } = validFilters[filter];
        
        // Type validation
        if (typeof value !== type) {
          throw new Error(`Invalid type for ${filter}: expected ${type}`);
        }

        // Minimum value validation
        if (min !== undefined && value < min) {
          throw new Error(`${filter} must be greater than or equal to ${min}`);
        }

        // Enum validation
        if (enumValues && !enumValues.includes(value)) {
          throw new Error(`Invalid value for ${filter}: must be one of ${enumValues.join(', ')}`);
        }
      }
    }

    return params;
  }

  getHash() {
    // Create a unique hash for the search parameters
    return Object.keys(this.params)
      .sort()
      .map(key => `${key}=${this.params[key]}`)
      .join('&');
  }

  async execute() {
    try {
      // Track search start
      await trackEvent('search_start', {
        userId: this.userId,
        params: this.params
      });

      // Check cache first
      const cachedResults = await getCache(this.cacheKey);
      if (cachedResults) {
        logger.info(`Returning cached results for ${this.cacheKey}`);
        await trackEvent('cache_hit', {
          userId: this.userId,
          cacheKey: this.cacheKey,
          resultCount: JSON.parse(cachedResults).length
        });
        return JSON.parse(cachedResults);
      }

      // Fetch fresh results from Vinted
      let results = await fetchVintedItems(this.params);
      
      // Apply filters if specified
      if (this.params.price) {
        results = results.filter(item => {
          const price = item.price;
          return (!this.params.price.min || price >= this.params.price.min) &&
                 (!this.params.price.max || price <= this.params.price.max);
        });
      }

      if (this.params.brand) {
        results = results.filter(item => 
          item.brand.toLowerCase() === this.params.brand.toLowerCase()
        );
      }

      if (this.params.condition) {
        results = results.filter(item => 
          item.condition === this.params.condition
        );
      }

      // Apply sorting
      if (this.params.order) {
        switch (this.params.order) {
          case 'price_low_to_high':
            results.sort((a, b) => a.price - b.price);
            break;
          case 'price_high_to_low':
            results.sort((a, b) => b.price - a.price);
            break;
          case 'newest_first':
            results.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        }
      }

      // Deduplicate results
      const seenIds = new Set();
      results = results.filter(item => {
        if (seenIds.has(item.id)) {
          return false;
        }
        seenIds.add(item.id);
        return true;
      });

      // Cache results for 5 minutes
      await setCache(this.cacheKey, JSON.stringify(results), 300);
      
      // Track successful search
      await trackEvent('search_success', {
        userId: this.userId,
        resultCount: results.length,
        params: this.params
      });

      return results;
    } catch (error) {
      logger.error(`Search query failed: ${error.message}`, { 
        userId: this.userId,
        params: this.params
      });
      await trackEvent('search_error', {
        userId: this.userId,
        error: error.message,
        params: this.params
      });
      throw error;
    }
  }
}

export default SearchQuery;
