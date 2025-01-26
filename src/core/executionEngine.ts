import { VintedAPI } from '../services/vintedService.js';
import { ItemTracker } from '../services/itemTracker.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../lib/redis.js';
import cron from 'node-cron';

interface SearchConfig {
  search_text?: string;
  price_from?: number;
  price_to?: number;
  order?: 'newest_first' | 'price_high_to_low' | 'price_low_to_high';
}

export class ExecutionEngine {
  private vintedAPI: VintedAPI;
  private itemTracker: ItemTracker;
  private isRunning: boolean = false;
  private cronJobs: cron.ScheduledTask[] = [];

  constructor() {
    this.vintedAPI = new VintedAPI();
    this.itemTracker = new ItemTracker();
  }

  async initialize(): Promise<void> {
    try {
      // Connect to Redis if not already connected
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      // Schedule periodic item cleanup
      this.scheduleDailyCleanup();
      
      // Schedule item checks
      this.scheduleItemChecks();
      
      this.isRunning = true;
      logger.info('Execution engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize execution engine', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private scheduleDailyCleanup(): void {
    // Run cleanup at 3 AM every day
    const cleanup = cron.schedule('0 3 * * *', async () => {
      try {
        await this.itemTracker.cleanup();
        logger.info('Daily cleanup completed');
      } catch (error) {
        logger.error('Daily cleanup failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    this.cronJobs.push(cleanup);
  }

  private scheduleItemChecks(): void {
    // Check for new items every 5 minutes
    const itemCheck = cron.schedule('*/5 * * * *', async () => {
      try {
        await this.checkNewItems();
      } catch (error) {
        logger.error('Item check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    this.cronJobs.push(itemCheck);
  }

  async checkNewItems(config: SearchConfig = {}): Promise<void> {
    try {
      const searchParams = {
        ...config,
        order: config.order || 'newest_first'
      };

      const response = await this.vintedAPI.searchItems(searchParams);
      const newItems = await this.itemTracker.filterNewItems(response.items);

      if (newItems.length > 0) {
        logger.info(`Found ${newItems.length} new items`);
        // Here you would typically notify users about new items
        // This will be implemented in the notification service
      }
    } catch (error) {
      logger.error('Failed to check new items', {
        error: error instanceof Error ? error.message : 'Unknown error',
        config
      });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      // Stop all cron jobs
      this.cronJobs.forEach(job => job.stop());
      this.cronJobs = [];
      
      // Close Redis connection
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
      
      this.isRunning = false;
      logger.info('Execution engine stopped');
    } catch (error) {
      logger.error('Failed to stop execution engine', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }
} 