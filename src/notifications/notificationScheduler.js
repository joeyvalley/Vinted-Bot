import cron from 'node-cron';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import Redis from '../cache/redis';

class NotificationScheduler {
  constructor(telegramNotifier) {
    this.telegramNotifier = telegramNotifier;
    this.redis = new Redis();
    this.scheduledTasks = new Map();
  }

  /**
   * Schedule a recurring notification
   * @param {String} chatId - Telegram chat ID
   * @param {String} cronExpression - Cron schedule expression
   * @param {String} message - Notification message
   * @returns {Promise<void>}
   */
  async scheduleNotification(chatId, cronExpression, message) {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // Check if task already exists
      if (this.scheduledTasks.has(chatId)) {
        throw new Error('Notification schedule already exists for this user');
      }

      // Create and store the scheduled task
      const task = cron.schedule(cronExpression, async () => {
        try {
          await this.telegramNotifier.sendNotification(chatId, message);
        } catch (error) {
          logger.error(`Failed to send scheduled notification to ${chatId}: ${error.message}`);
        }
      });

      this.scheduledTasks.set(chatId, task);

      // Store schedule in Redis
      await this.redis.set(
        `notification:${chatId}`,
        JSON.stringify({ cronExpression, message })
      );

      logger.info(`Scheduled notification for ${chatId} with expression ${cronExpression}`);
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Update an existing notification schedule
   * @param {String} chatId - Telegram chat ID
   * @param {String} cronExpression - New cron schedule expression
   * @param {String} message - New notification message
   * @returns {Promise<void>}
   */
  async updateSchedule(chatId, cronExpression, message) {
    try {
      await this.cancelSchedule(chatId);
      await this.scheduleNotification(chatId, cronExpression, message);
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param {String} chatId - Telegram chat ID
   * @returns {Promise<void>}
   */
  async cancelSchedule(chatId) {
    try {
      const task = this.scheduledTasks.get(chatId);
      if (task) {
        task.stop();
        this.scheduledTasks.delete(chatId);
      }

      // Remove from Redis
      await this.redis.del(`notification:${chatId}`);

      logger.info(`Cancelled notification schedule for ${chatId}`);
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Get current schedule for a user
   * @param {String} chatId - Telegram chat ID
   * @returns {Promise<Object|null>} Schedule details or null if not found
   */
  async getSchedule(chatId) {
    try {
      const schedule = await this.redis.get(`notification:${chatId}`);
      return schedule ? JSON.parse(schedule) : null;
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Initialize schedules from Redis on startup
   * @returns {Promise<void>}
   */
  async initializeSchedules() {
    try {
      const keys = await this.redis.keys('notification:*');
      
      for (const key of keys) {
        const chatId = key.split(':')[1];
        const schedule = await this.getSchedule(chatId);
        
        if (schedule) {
          await this.scheduleNotification(
            chatId,
            schedule.cronExpression,
            schedule.message
          );
        }
      }
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }
}

export default NotificationScheduler;
