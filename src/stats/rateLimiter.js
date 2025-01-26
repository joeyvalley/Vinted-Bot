import redis from 'redis';
import { REDIS_HOST, REDIS_PORT } from '../config/env.js';
import logger from '../utils/logger.js';

const client = redis.createClient({ 
  host: REDIS_HOST,
  port: REDIS_PORT
});

// Rate limit configuration
const RATE_LIMITS = {
  search: {
    window: 60, // 1 minute window
    maxRequests: 30
  },
  notifications: {
    window: 3600, // 1 hour window
    maxRequests: 100
  },
  api: {
    window: 86400, // 1 day window
    maxRequests: 1000
  }
};

// Track rate limit violations
const VIOLATION_POLICY = {
  initialBan: 60, // 1 minute
  maxBan: 86400, // 1 day
  multiplier: 2
};

/**
 * Check if request is allowed based on rate limits
 * @param {string} userId - User ID
 * @param {string} type - Rate limit type (search, notifications, api)
 * @returns {object} { allowed: boolean, remaining: number, reset: number }
 */
export async function checkRateLimit(userId, type) {
  try {
    if (!RATE_LIMITS[type]) {
      throw new Error(`Invalid rate limit type: ${type}`);
    }

    const { window, maxRequests } = RATE_LIMITS[type];
    const key = `rate_limit:${userId}:${type}`;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Get current count
    const count = await client.incr(key);
    
    // If first request in window, set expiration
    if (count === 1) {
      await client.expire(key, window);
    }
    
    // Check if limit exceeded
    if (count > maxRequests) {
      // Track violation
      await trackViolation(userId, type);
      return {
        allowed: false,
        remaining: 0,
        reset: await client.ttl(key)
      };
    }
    
    return {
      allowed: true,
      remaining: maxRequests - count,
      reset: await client.ttl(key)
    };
  } catch (error) {
    logger.error(`Rate limit check failed: ${error.message}`);
    throw error;
  }
}

/**
 * Track rate limit violations and apply bans
 * @param {string} userId - User ID
 * @param {string} type - Rate limit type
 */
async function trackViolation(userId, type) {
  try {
    const violationKey = `rate_limit:${userId}:violations`;
    const banKey = `rate_limit:${userId}:ban`;
    
    // Increment violation count
    const violations = await client.incr(violationKey);
    
    // Calculate ban duration
    const banDuration = Math.min(
      VIOLATION_POLICY.initialBan * Math.pow(VIOLATION_POLICY.multiplier, violations - 1),
      VIOLATION_POLICY.maxBan
    );
    
    // Set ban if not already banned
    const currentBan = await client.ttl(banKey);
    if (currentBan <= 0) {
      await client.set(banKey, 'banned', 'EX', banDuration);
    }
    
    // Log violation
    logger.warn(`Rate limit violation by user ${userId} for ${type}. Ban duration: ${banDuration}s`);
  } catch (error) {
    logger.error(`Failed to track violation: ${error.message}`);
  }
}

/**
 * Check if user is currently banned
 * @param {string} userId - User ID
 * @returns {boolean} True if banned
 */
export async function isBanned(userId) {
  try {
    const banKey = `rate_limit:${userId}:ban`;
    return await client.exists(banKey) === 1;
  } catch (error) {
    logger.error(`Failed to check ban status: ${error.message}`);
    return false;
  }
}

/**
 * Get rate limit status for user
 * @param {string} userId - User ID
 * @returns {object} Rate limit status for all types
 */
export async function getRateLimitStatus(userId) {
  try {
    const status = {};
    
    for (const [type, config] of Object.entries(RATE_LIMITS)) {
      const key = `rate_limit:${userId}:${type}`;
      const count = await client.get(key) || 0;
      const ttl = await client.ttl(key);
      
      status[type] = {
        used: parseInt(count),
        remaining: config.maxRequests - count,
        reset: ttl,
        max: config.maxRequests,
        window: config.window
      };
    }
    
    return status;
  } catch (error) {
    logger.error(`Failed to get rate limit status: ${error.message}`);
    return {};
  }
}
