import redis from 'redis';
import { logger } from '../utils/logger.js';
import { REDIS_HOST, REDIS_PORT } from '../config/env.js';

const client = redis.createClient({ 
    host: REDIS_HOST,
    port: REDIS_PORT
});

client.on('error', (err) => {
    logger.error(`Redis error: ${err.message}`);
});

async function connect() {
    await client.connect();
    logger.info('Connected to Redis');
}

async function setCache(key, value, ttl = 3600) {
    try {
        await client.set(key, value, {
            EX: ttl
        });
        return true;
    } catch (error) {
        logger.error(`Failed to set cache: ${error.message}`);
        throw error;
    }
}

async function getCache(key) {
    try {
        const value = await client.get(key);
        return value;
    } catch (error) {
        logger.error(`Failed to get cache: ${error.message}`);
        throw error;
    }
}

export { 
    setCache,
    getCache,
    client,
    connect
};
