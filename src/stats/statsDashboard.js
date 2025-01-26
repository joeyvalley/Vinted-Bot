import { getStatistics, getEventLogs, getRateLimitStatus } from './statsTracker.js';
import logger from '../utils/logger.js';

/**
 * Statistics Dashboard
 */
export class StatsDashboard {
  /**
   * Display overview statistics
   * @param {string} period - Time period (day, week, month)
   */
  async showOverview(period = 'day') {
    try {
      const stats = await getStatistics(period);
      
      console.log('\n=== Statistics Overview ===');
      console.log(`Period: ${period}`);
      console.log('--------------------------');
      
      for (const [eventType, count] of Object.entries(stats)) {
        console.log(`${eventType}: ${count}`);
      }
      
      console.log('==========================\n');
    } catch (error) {
      logger.error(`Failed to display overview: ${error.message}`);
    }
  }

  /**
   * Display detailed event logs
   * @param {string} eventType - Type of events to show
   * @param {number} limit - Maximum number of events to display
   */
  async showEventLogs(eventType, limit = 10) {
    try {
      const events = await getEventLogs(eventType, limit);
      
      console.log(`\n=== ${eventType} Event Logs ===`);
      console.log(`Showing ${events.length} most recent events`);
      console.log('------------------------------');
      
      events.forEach((event, index) => {
        console.log(`#${index + 1}`);
        for (const [key, value] of Object.entries(event)) {
          console.log(`${key}: ${value}`);
        }
        console.log('------------------------------');
      });
    } catch (error) {
      logger.error(`Failed to display event logs: ${error.message}`);
    }
  }

  /**
   * Display trends over time
   * @param {string} eventType - Type of event to analyze
   * @param {string} period - Time period (day, week, month)
   */
  async showTrends(eventType, period = 'week') {
    try {
      const stats = await getStatistics(period);
      
      console.log(`\n=== ${eventType} Trends ===`);
      console.log(`Period: ${period}`);
      console.log('------------------------');
      
      if (stats[eventType]) {
        console.log(`Total ${eventType} events: ${stats[eventType]}`);
      } else {
        console.log(`No ${eventType} events found`);
      }
      
      console.log('========================\n');
    } catch (error) {
      logger.error(`Failed to display trends: ${error.message}`);
    }
  }

  /**
   * Display rate limit information
   * @param {string} userId - User ID to check rate limits for
   */
  async showRateLimits(userId) {
    try {
      const rateLimits = await getRateLimitStatus(userId);
      
      console.log('\n=== Rate Limits ===');
      console.log(`User: ${userId}`);
      console.log('------------------');
      
      for (const [eventType, status] of Object.entries(rateLimits)) {
        console.log(`${eventType}:`);
        console.log(`  Used: ${status.used}/${status.limit}`);
        console.log(`  Remaining: ${status.remaining}`);
        console.log(`  Resets in: ${status.resetIn} seconds`);
        console.log('------------------');
      }
      
      console.log('==================\n');
    } catch (error) {
      logger.error(`Failed to display rate limits: ${error.message}`);
    }
  }

  /**
   * Generate system-wide statistics report
   * @param {string} period - Time period (day, week, month)
   */
  async generateSystemReport(period = 'day') {
    try {
      const stats = await getStatistics(period);
      
      console.log('\n=== System Report ===');
      console.log(`Period: ${period}`);
      console.log('-------------------');
      
      // System-wide statistics
      console.log('Total Users:', stats.totalUsers || 0);
      console.log('Active Users:', stats.activeUsers || 0);
      console.log('Total Searches:', stats.totalSearches || 0);
      console.log('Total Notifications:', stats.totalNotifications || 0);
      console.log('Notification Success Rate:', 
        stats.notificationSuccessRate ? `${stats.notificationSuccessRate}%` : 'N/A');
      
      console.log('====================\n');
    } catch (error) {
      logger.error(`Failed to generate system report: ${error.message}`);
    }
  }

  /**
   * Generate user activity report
   * @param {string} userId - User ID to generate report for
   * @param {string} period - Time period (day, week, month)
   */
  async generateUserActivityReport(userId, period = 'day') {
    try {
      const stats = await getStatistics(period);
      
      console.log('\n=== User Activity Report ===');
      console.log(`User: ${userId}`);
      console.log(`Period: ${period}`);
      console.log('---------------------------');
      
      // User-specific statistics
      console.log('Searches:', stats.userSearches?.[userId] || 0);
      console.log('Notifications Received:', stats.userNotifications?.[userId] || 0);
      console.log('Active Days:', stats.userActiveDays?.[userId] || 0);
      
      console.log('===========================\n');
    } catch (error) {
      logger.error(`Failed to generate user activity report: ${error.message}`);
    }
  }

  /**
   * Generate error and warning report
   * @param {string} period - Time period (day, week, month)
   */
  async generateErrorReport(period = 'day') {
    try {
      const stats = await getStatistics(period);
      
      console.log('\n=== Error Report ===');
      console.log(`Period: ${period}`);
      console.log('------------------');
      
      // Error statistics
      console.log('Total Errors:', stats.totalErrors || 0);
      console.log('API Errors:', stats.apiErrors || 0);
      console.log('Notification Errors:', stats.notificationErrors || 0);
      console.log('Most Common Error:', stats.mostCommonError || 'N/A');
      
      console.log('===================\n');
    } catch (error) {
      logger.error(`Failed to generate error report: ${error.message}`);
    }
  }

  /**
   * Generate rate limit usage report
   * @param {string} period - Time period (day, week, month)
   */
  async generateRateLimitReport(period = 'day') {
    try {
      const stats = await getStatistics(period);
      
      console.log('\n=== Rate Limit Report ===');
      console.log(`Period: ${period}`);
      console.log('------------------------');
      
      // Rate limit statistics
      console.log('Rate Limit Hits:', stats.rateLimitHits || 0);
      console.log('Most Limited Endpoint:', stats.mostLimitedEndpoint || 'N/A');
      console.log('Users Affected:', stats.usersAffectedByRateLimits || 0);
      
      console.log('========================\n');
    } catch (error) {
      logger.error(`Failed to generate rate limit report: ${error.message}`);
    }
  }

  /**
   * Generate notification delivery report
   * @param {string} period - Time period (day, week, month)
   */
  async generateNotificationReport(period = 'day') {
    try {
      const stats = await getStatistics(period);
      
      console.log('\n=== Notification Report ===');
      console.log(`Period: ${period}`);
      console.log('--------------------------');
      
      // Notification statistics
      console.log('Total Notifications Sent:', stats.totalNotifications || 0);
      console.log('Successful Deliveries:', stats.successfulNotifications || 0);
      console.log('Failed Deliveries:', stats.failedNotifications || 0);
      console.log('Delivery Success Rate:', 
        stats.notificationSuccessRate ? `${stats.notificationSuccessRate}%` : 'N/A');
      
      console.log('==========================\n');
    } catch (error) {
      logger.error(`Failed to generate notification report: ${error.message}`);
    }
  }
}
