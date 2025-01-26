import redis from 'redis';
import { REDIS_HOST, REDIS_PORT } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { checkRateLimit, trackViolation } from './rateLimiter.js';

const client = redis.createClient({ 
  host: REDIS_HOST, 
  port: REDIS_PORT 
});

// Initialize Redis connection
client.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

/**
 * Record user activity
 * @param {string} userId - Telegram user ID
 * @param {string} eventType - Type of activity (e.g., 'search', 'notification')
 * @param {object} metadata - Additional event data
 */
export { checkRateLimit };

export async function recordActivity(activityData) {
  try {
    const { userId, eventType, timestamp, ...metadata } = activityData;
    const key = `user:${userId}:activity:${timestamp}`;
    
    await client.hSet(key, {
      eventType,
      ...metadata,
      timestamp
    });
    
    // Increment user activity counter
    await client.hIncrBy(`user:${userId}:stats`, eventType, 1);
    
    logger.info(`Recorded activity for user ${userId}: ${eventType}`);
  } catch (error) {
    logger.error(`Failed to record activity: ${error.message}`);
    throw error;
  }
}

/**
 * Get user activity statistics
 * @param {string} userId - Telegram user ID
 * @param {string} period - Time period ('day', 'week', 'month')
 * @returns {object} Activity statistics
 */
export async function getUserActivity(userId, period = 'day') {
  try {
    const date = new Date();
    let keys = [];
    
    switch (period) {
      case 'day':
        const dayKey = date.toISOString().split('T')[0];
        keys.push(`user:${userId}:activity:*`);
        break;
        
      case 'week':
        for (let i = 0; i < 7; i++) {
          const day = new Date(date);
          day.setDate(date.getDate() - i);
          keys.push(`user:${userId}:activity:*`);
        }
        break;
        
      case 'month':
        const daysInMonth = new Date(
          date.getFullYear(), 
          date.getMonth() + 1, 
          0
        ).getDate();
        
        for (let i = 0; i < daysInMonth; i++) {
          const day = new Date(date);
          day.setDate(date.getDate() - i);
          keys.push(`user:${userId}:activity:*`);
        }
        break;
    }
    
    const stats = {};
    
    for (const keyPattern of keys) {
      const activityKeys = await client.keys(keyPattern);
      for (const key of activityKeys) {
        const activity = await client.hGetAll(key);
        stats[activity.eventType] = (stats[activity.eventType] || 0) + 1;
      }
    }
    
    return stats;
  } catch (error) {
    logger.error(`Failed to get user activity: ${error.message}`);
    throw error;
  }
}

/**
 * Track a statistic event
 * @param {string} eventType - Type of event to track (search, notification, error)
 * @param {object} metadata - Additional event data
 */
export async function trackEvent(eventType, metadata = {}) {
  // Check rate limit before tracking event
  if (metadata.userId) {
    const rateLimit = await checkRateLimit(metadata.userId, eventType);
    if (!rateLimit.allowed) {
      await trackViolation(metadata.userId, eventType);
      throw new Error(`Rate limit exceeded for ${eventType}`);
    }
  }
  try {
    const timestamp = Date.now();
    const key = `stats:${eventType}:${timestamp}`;
    
    await client.hSet(key, {
      ...metadata,
      timestamp
    });
    
    // Increment daily counter
    const date = new Date().toISOString().split('T')[0];
    await client.hIncrBy(`stats:daily:${date}`, eventType, 1);
    
    logger.info(`Tracked ${eventType} event`);
  } catch (error) {
    logger.error(`Failed to track event: ${error.message}`);
  }
}

/**
 * Get statistics for a specific time period
 * @param {string} period - Time period (day, week, month)
 * @returns {object} Aggregated statistics
 */
export async function getStatistics(period = 'day') {
  try {
    const date = new Date();
    let keys = [];
    
    switch (period) {
      case 'day':
        const dayKey = date.toISOString().split('T')[0];
        keys.push(`stats:daily:${dayKey}`);
        break;
        
      case 'week':
        for (let i = 0; i < 7; i++) {
          const day = new Date(date);
          day.setDate(date.getDate() - i);
          const dayKey = day.toISOString().split('T')[0];
          keys.push(`stats:daily:${dayKey}`);
        }
        break;
        
      case 'month':
        const daysInMonth = new Date(
          date.getFullYear(), 
          date.getMonth() + 1, 
          0
        ).getDate();
        
        for (let i = 0; i < daysInMonth; i++) {
          const day = new Date(date);
          day.setDate(date.getDate() - i);
          const dayKey = day.toISOString().split('T')[0];
          keys.push(`stats:daily:${dayKey}`);
        }
        break;
    }
    
    const stats = {};
    
    for (const key of keys) {
      const dayStats = await client.hGetAll(key);
      for (const [eventType, count] of Object.entries(dayStats)) {
        stats[eventType] = (stats[eventType] || 0) + parseInt(count);
      }
    }
    
    // Add system-wide statistics
    stats.totalUsers = await client.scard('users');
    stats.activeUsers = await client.zcount('active_users', '-inf', '+inf');
    
    // Add error statistics
    const errorKeys = await client.keys('error:*');
    stats.totalErrors = errorKeys.length;
    
    // Add rate limit statistics
    const rateLimitKeys = await client.keys('rate_limit:*');
    stats.rateLimitViolations = rateLimitKeys.length;
    
    // Add notification statistics
    const notificationStats = await client.hGetAll('notification_stats');
    stats.notificationsSent = parseInt(notificationStats.sent || 0);
    stats.notificationsFailed = parseInt(notificationStats.failed || 0);
    stats.notificationSuccessRate = 
      stats.notificationsSent > 0 ? 
      ((stats.notificationsSent - stats.notificationsFailed) / stats.notificationsSent) * 100 : 0;
    
    return stats;
  } catch (error) {
    logger.error(`Failed to get statistics: ${error.message}`);
    return {};
  }
}

/**
 * Get detailed error reports
 * @param {number} limit - Maximum number of errors to return
 * @returns {Array} Array of error objects
 */
export async function getErrorReports(limit = 100) {
  try {
    const errorKeys = await client.keys('error:*');
    const errors = [];
    
    for (const key of errorKeys.slice(0, limit)) {
      const error = await client.hGetAll(key);
      errors.push({
        ...error,
        timestamp: parseInt(error.timestamp)
      });
    }
    
    return errors.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    logger.error(`Failed to get error reports: ${error.message}`);
    return [];
  }
}

/**
 * Get rate limit usage statistics
 * @returns {object} Rate limit statistics
 */
export async function getRateLimitStats() {
  try {
    const rateLimitKeys = await client.keys('rate_limit:*');
    const stats = {
      totalViolations: rateLimitKeys.length,
      byUser: {},
      byEndpoint: {}
    };
    
    for (const key of rateLimitKeys) {
      const violation = await client.hGetAll(key);
      const userId = violation.userId;
      const endpoint = violation.endpoint;
      
      // Count violations by user
      stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;
      
      // Count violations by endpoint
      stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;
    }
    
    return stats;
  } catch (error) {
    logger.error(`Failed to get rate limit stats: ${error.message}`);
    return {};
  }
}

/**
 * Get notification delivery statistics
 * @returns {object} Notification statistics
 */
export async function getNotificationStats() {
  try {
    const stats = await client.hGetAll('notification_stats');
    return {
      sent: parseInt(stats.sent || 0),
      failed: parseInt(stats.failed || 0),
      successRate: stats.sent > 0 ? 
        ((stats.sent - stats.failed) / stats.sent) * 100 : 0
    };
  } catch (error) {
    logger.error(`Failed to get notification stats: ${error.message}`);
    return {};
  }
}

/**
 * Get detailed event logs
 * @param {string} eventType - Type of events to retrieve
 * @param {number} limit - Maximum number of events to return
 * @returns {Array} Array of event objects
 */
export async function getEventLogs(eventType, limit = 100) {
  try {
    const keys = await client.keys(`stats:${eventType}:*`);
    const events = [];
    
    for (const key of keys.slice(0, limit)) {
      const event = await client.hGetAll(key);
      events.push(event);
    }
    
    return events;
  } catch (error) {
    logger.error(`Failed to get event logs: ${error.message}`);
    return [];
  }
}
