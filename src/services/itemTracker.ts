import { redisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const ITEM_TTL = 604800; // 7 days in seconds

interface TrackedItem {
  id: number;
  title: string;
  price: number;
  url: string;
  timestamp: number;
}

export class ItemTracker {
  async isItemNew(itemId: number): Promise<boolean> {
    const key = `item:${itemId}`;
    const exists = await redisClient.exists(key);
    return exists === 0;
  }

  async trackItem(item: TrackedItem): Promise<void> {
    const key = `item:${item.id}`;
    try {
      await redisClient.setEx(key, ITEM_TTL, JSON.stringify({
        ...item,
        timestamp: Date.now()
      }));
    } catch (error) {
      logger.error('Failed to track item', {
        itemId: item.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async filterNewItems<T extends { id: number }>(items: T[]): Promise<T[]> {
    try {
      const newItems: T[] = [];
      
      for (const item of items) {
        if (await this.isItemNew(item.id)) {
          newItems.push(item);
          // Track the item immediately
          await this.trackItem({
            id: item.id,
            title: 'title' in item ? (item as any).title : 'Unknown',
            price: 'price' in item ? (item as any).price : 0,
            url: 'url' in item ? (item as any).url : '',
            timestamp: Date.now()
          });
        }
      }
      
      return newItems;
    } catch (error) {
      logger.error('Failed to filter new items', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getRecentItems(limit: number = 100): Promise<TrackedItem[]> {
    try {
      const keys = await redisClient.keys('item:*');
      const items: TrackedItem[] = [];
      
      for (const key of keys.slice(0, limit)) {
        const data = await redisClient.get(key);
        if (data) {
          items.push(JSON.parse(data));
        }
      }
      
      return items.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to get recent items', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async cleanup(maxAge: number = ITEM_TTL): Promise<void> {
    try {
      const keys = await redisClient.keys('item:*');
      const now = Date.now();
      
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const item = JSON.parse(data) as TrackedItem;
          if (now - item.timestamp > maxAge * 1000) {
            await redisClient.del(key);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup items', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
} 