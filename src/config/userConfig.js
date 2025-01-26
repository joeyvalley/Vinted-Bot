// User Configuration Module
import { setCache, getCache, deleteCache } from '../cache/redis.js';
import { logger } from '../utils/logger.js';
import Ajv from 'ajv';
import { userConfigSchema } from './userConfigSchema.js';

const ajv = new Ajv({
  strict: false,
  strictSchema: false,
  strictTypes: false
});
const validate = ajv.compile(userConfigSchema);

export default class UserConfig {
    defaultConfig = {
        searchParams: {},
        notificationPreferences: {
            frequency: 'daily',
            maxPrice: 100
        }
    };

    static validateConfig(config) {
        const valid = validate(config);
        if (!valid) {
            const errors = validate.errors.map(err => `${err.instancePath} ${err.message}`);
            throw new Error(`Invalid configuration: ${errors.join(', ')}`);
        }
        return true;
    }

    constructor(userId) {
        this.userId = userId;
        this.configKey = `user:${userId}:config`;
    }

    async setConfig(config) {
        try {
            this.constructor.validateConfig(config);
            await setCache(this.configKey, JSON.stringify(config));
            logger.info(`Updated config for user ${this.userId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to set config for user ${this.userId}: ${error.message}`);
            throw error;
        }
    }

    async getConfig() {
        try {
            const config = await getCache(this.configKey);
            return config ? JSON.parse(config) : this.defaultConfig;
        } catch (error) {
            logger.error(`Failed to get config for user ${this.userId}: ${error.message}`);
            throw error;
        }
    }

    async updateConfig(newConfig) {
        try {
            const currentConfig = await this.getConfig() || {};
            const updatedConfig = { ...currentConfig, ...newConfig };
            this.constructor.validateConfig(updatedConfig);
            await this.setConfig(updatedConfig);
            return updatedConfig;
        } catch (error) {
            logger.error(`Failed to update config for user ${this.userId}: ${error.message}`);
            throw error;
        }
    }

    async deleteConfig() {
        try {
            await deleteCache(this.configKey);
            logger.info(`Deleted config for user ${this.userId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to delete config for user ${this.userId}: ${error.message}`);
            throw error;
        }
    }

    async executeSearch() {
        try {
            const config = await this.getConfig();
            if (!config?.searchPreferences) {
                throw new Error('No search preferences configured');
            }
            
            const searchQuery = new SearchQuery(this.userId, config.searchPreferences);
            return await searchQuery.execute();
        } catch (error) {
            logger.error(`Failed to execute search for user ${this.userId}: ${error.message}`);
            throw error;
        }
    }
}

import SearchQuery from '../search/searchQuery.js';
