import 'dotenv/config';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const VINTED_API_KEY = process.env.VINTED_API_KEY;
export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;
export const PROXY_URL = process.env.PROXY_URL;
