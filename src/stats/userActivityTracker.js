import { StatsTracker } from './statsTracker.js';
import { logger } from '../utils/logger.js';

class UserActivityTracker {
    constructor() {
        this.statsTracker = new StatsTracker();
    }

    /**
     * Track user activity event
     * @param {string} userId - Telegram user ID
     * @param {string} eventType - Type of activity (e.g., 'search', 'notification')
     * @param {object} metadata - Additional event data
     */
    async trackActivity(userId, eventType, metadata = {}) {
        try {
            const timestamp = new Date().toISOString();
            const activityData = {
                userId,
                eventType,
                timestamp,
                ...metadata
            };

            // Store in statistics system
            await this.statsTracker.recordActivity(activityData);
            
            logger.info(`Tracked activity: ${eventType} for user ${userId}`);
        } catch (error) {
            logger.error(`Failed to track activity: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get user activity statistics
     * @param {string} userId - Telegram user ID
     * @param {string} period - Time period ('day', 'week', 'month')
     * @returns {Promise<object>} Activity statistics
     */
    async getUserActivity(userId, period = 'day') {
        try {
            const stats = await this.statsTracker.getUserActivity(userId, period);
            return stats;
        } catch (error) {
            logger.error(`Failed to get user activity: ${error.message}`);
            throw error;
        }
    }
}

export { UserActivityTracker };
