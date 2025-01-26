const { fetchVintedItems } = require('./scraper/scraper');
const { sendNotification } = require('./notifications/telegram');
const { setCache, getCache } = require('./cache/redis');
const { trackEvent, checkRateLimit } = require('./stats/statsTracker');
const logger = require('./utils/logger');
const errorHandler = require('./utils/errorHandler');

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

logger.info('Bot started!');

async function main() {
    try {
        // Check rate limits before proceeding
        const rateLimitStatus = await checkRateLimit('main');
        if (!rateLimitStatus.allowed) {
            logger.warn(`Rate limit exceeded. Try again in ${rateLimitStatus.retryAfter} seconds`);
            return;
        }

        const items = await fetchVintedItems({});
        logger.info(`Fetched ${items.length} items`);
        
        // Track the API call
        await trackEvent('api_call', { count: items.length });

        // TODO: Add logic to process and notify users
    } catch (error) {
        logger.error(`Error in main execution: ${error.message}`);
        errorHandler(error);
    }
}

process.on('unhandledRejection', (error) => {
    logger.error(`Unhandled rejection: ${error.message}`);
    errorHandler(error);
});

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    errorHandler(error);
    process.exit(1);
});

main();
