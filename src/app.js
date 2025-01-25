import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL);

// Bot command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await redis.set(`user:${chatId}:subscribed`, true);
  bot.sendMessage(chatId, 'Welcome! You will now receive updates from Vinted.');
});

// Function to fetch Vinted items
async function fetchVintedItems() {
  try {
    const response = await fetch('https://www.vinted.com/api/...'); // Replace with the actual API URL
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const data = await response.json();

    // Process and notify users
    console.log(data); // Replace this with notification logic
  } catch (error) {
    console.error('Failed to fetch Vinted items:', error.message);
  }
}

// Polling Vinted API every minute
setInterval(fetchVintedItems, 60000);

// wazzup

