const TelegramBot = require('node-telegram-bot-api');
const { logger } = require('../utils/logger');
const { errorHandler } = require('../utils/errorHandler');
const { trackEvent } = require('../stats/statsTracker');
const UserConfig = require('../config/userConfig');
const NotificationScheduler = require('./notificationScheduler');
const { StatsDashboard } = require('../stats/statsDashboard');

class TelegramNotifier {
    constructor(token) {
        this.bot = new TelegramBot(token, { polling: true });
        this.scheduler = new NotificationScheduler(this);
        this.initialize();
    }

    async initialize() {
        try {
            await this.scheduler.initializeSchedules();
            this.setupHandlers();
            logger.info('Telegram notifier initialized with scheduled notifications');
        } catch (error) {
            errorHandler(error);
            throw error;
        }
    }

    setupHandlers() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, 'Welcome to Vinted Bot! Use /help to see available commands');
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            const helpText = `Available commands:
/setconfig - Configure your search preferences
/getconfig - View your current configuration
/resetconfig - Reset your configuration to defaults
/search - Execute a search with your current preferences
/setschedule - Set a notification schedule (cron format)
/updateschedule - Update your notification schedule
/cancelschedule - Cancel your notification schedule
/getschedule - View your current notification schedule
/stats - View bot usage statistics
/reports - View admin reports (errors, rate limits, notifications)`;
            this.bot.sendMessage(chatId, helpText);
        });

        // Stats command
        this.bot.onText(/\/stats/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const statsDashboard = new StatsDashboard();
                const stats = await statsDashboard.getStatistics('day');
                const statsText = Object.entries(stats)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
                this.bot.sendMessage(chatId, `Daily Statistics:\n${statsText}`);
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Stats error for ${chatId}: ${error.message}`);
            }
        });

        // Reports command
        this.bot.onText(/\/reports/, (msg) => {
            const chatId = msg.chat.id;
            const reportText = `Available reports:
/errors - Show error reports
/ratelimits - Show rate limit violations
/notifications - Show notification delivery stats`;
            this.bot.sendMessage(chatId, reportText);
        });

        // Error reports command
        this.bot.onText(/\/errors/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const statsDashboard = new StatsDashboard();
                const errors = await statsDashboard.getErrorReports(10);
                if (errors.length > 0) {
                    const errorText = errors.map((err, i) => 
                        `${i + 1}. ${err.message}\nTimestamp: ${new Date(err.timestamp).toLocaleString()}`
                    ).join('\n\n');
                    this.bot.sendMessage(chatId, `Recent Errors:\n${errorText}`);
                } else {
                    this.bot.sendMessage(chatId, 'No errors found');
                }
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Error report error for ${chatId}: ${error.message}`);
            }
        });

        // Rate limit reports command
        this.bot.onText(/\/ratelimits/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const statsDashboard = new StatsDashboard();
                const rateLimits = await statsDashboard.getRateLimitStats();
                const rateLimitText = `Total violations: ${rateLimits.totalViolations}\n
By user:\n${Object.entries(rateLimits.byUser)
                    .map(([user, count]) => `${user}: ${count}`)
                    .join('\n')}\n
By endpoint:\n${Object.entries(rateLimits.byEndpoint)
                    .map(([endpoint, count]) => `${endpoint}: ${count}`)
                    .join('\n')}`;
                this.bot.sendMessage(chatId, `Rate Limit Violations:\n${rateLimitText}`);
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Rate limit report error for ${chatId}: ${error.message}`);
            }
        });

        // Notification stats command
        this.bot.onText(/\/notifications/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const statsDashboard = new StatsDashboard();
                const notificationStats = await statsDashboard.getNotificationStats();
                const notificationText = `Notifications sent: ${notificationStats.sent}
Notifications failed: ${notificationStats.failed}
Success rate: ${notificationStats.successRate.toFixed(2)}%`;
                this.bot.sendMessage(chatId, `Notification Statistics:\n${notificationText}`);
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Notification stats error for ${chatId}: ${error.message}`);
            }
        });

        // Set schedule command
        this.bot.onText(/\/setschedule (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            try {
                const { cronExpression, message } = JSON.parse(match[1]);
                await this.scheduler.scheduleNotification(chatId, cronExpression, message);
                this.bot.sendMessage(chatId, 'Notification schedule set successfully');
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Schedule error for ${chatId}: ${error.message}`);
            }
        });

        // Update schedule command
        this.bot.onText(/\/updateschedule (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            try {
                const { cronExpression, message } = JSON.parse(match[1]);
                await this.scheduler.updateSchedule(chatId, cronExpression, message);
                this.bot.sendMessage(chatId, 'Notification schedule updated successfully');
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Schedule update error for ${chatId}: ${error.message}`);
            }
        });

        // Cancel schedule command
        this.bot.onText(/\/cancelschedule/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                await this.scheduler.cancelSchedule(chatId);
                this.bot.sendMessage(chatId, 'Notification schedule cancelled');
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Schedule cancellation error for ${chatId}: ${error.message}`);
            }
        });

        // Get schedule command
        this.bot.onText(/\/getschedule/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const schedule = await this.scheduler.getSchedule(chatId);
                if (schedule) {
                    this.bot.sendMessage(chatId, `Current schedule:\nCron: ${schedule.cronExpression}\nMessage: ${schedule.message}`);
                } else {
                    this.bot.sendMessage(chatId, 'No active notification schedule');
                }
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Schedule retrieval error for ${chatId}: ${error.message}`);
            }
        });

        // Set configuration command
        this.bot.onText(/\/setconfig (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            try {
                const config = JSON.parse(match[1]);
                const userConfig = new UserConfig(chatId);
                await userConfig.setConfig(config);
                this.bot.sendMessage(chatId, 'Configuration updated successfully');
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Configuration error for ${chatId}: ${error.message}`);
            }
        });

        // Get configuration command
        this.bot.onText(/\/getconfig/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const userConfig = new UserConfig(chatId);
                const config = await userConfig.getConfig();
                this.bot.sendMessage(chatId, `Current configuration:\n${JSON.stringify(config, null, 2)}`);
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Configuration error for ${chatId}: ${error.message}`);
            }
        });

        // Reset configuration command
        this.bot.onText(/\/resetconfig/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const userConfig = new UserConfig(chatId);
                await userConfig.deleteConfig();
                this.bot.sendMessage(chatId, 'Configuration reset to defaults');
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Configuration error for ${chatId}: ${error.message}`);
            }
        });

        // Search command
        this.bot.onText(/\/search/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                const userConfig = new UserConfig(chatId);
                const results = await userConfig.executeSearch();
                if (results.length > 0) {
                    const message = results.map(item => 
                        `${item.title}\nPrice: ${item.price}\nLink: ${item.url}`
                    ).join('\n\n');
                    this.bot.sendMessage(chatId, message);
                } else {
                    this.bot.sendMessage(chatId, 'No results found for your search criteria');
                }
            } catch (error) {
                this.bot.sendMessage(chatId, `Error: ${error.message}`);
                logger.error(`Search error for ${chatId}: ${error.message}`);
            }
        });

        // Unknown command handler
        this.bot.on('message', (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, 'Command not recognized. Use /help for available commands');
        });
    }

    async sendNotification(chatId, message) {
        try {
            // Track notification attempt
            await trackEvent('notification_attempt', {
                chatId,
                messageLength: message.length
            });

            await this.bot.sendMessage(chatId, message);
            logger.info(`Notification sent to ${chatId}`);

            // Track notification success
            await trackEvent('notification_success', {
                chatId,
                messageLength: message.length
            });
        } catch (error) {
            errorHandler(error);
            
            // Track notification failure
            await trackEvent('notification_failure', {
                chatId,
                error: error.message,
                messageLength: message.length
            });
            
            throw error;
        }
    }
}

module.exports = TelegramNotifier;
