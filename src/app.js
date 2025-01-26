import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL);

// Bot command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! You will now receive updates from Vinted.');
});

bot.onText(/\/search/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Searching Vinted...');

  const items = await fetchVintedItems();

  if (!items.length) {
    bot.sendMessage(chatId, 'No new items found.');
    return;
  }

  for (const item of items) {
    try {
      // Send each item as an image, linking the image to the item's URL
      await bot.sendPhoto(chatId, item.imageUrl, {
        caption: `[${item.title || 'No title'}](${item.itemUrl})\nPrice: ${item.price || 'N/A'}\nSize: ${item.size || 'N/A'}`,
        parse_mode: 'Markdown',
      });

      // Add a delay between messages to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    } catch (error) {
      console.error('Error sending photo:', error.message);

      if (error.response?.body?.error_code === 429) {
        const retryAfter = error.response.body.parameters.retry_after || 1;
        console.warn(`Rate limit hit. Retrying after ${retryAfter} seconds.`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }
    }
  }
});

// Function to split messages that exceed the Telegram limit
function splitMessage(message, maxLength = 4000) {
  const chunks = [];
  let currentChunk = '';

  message.split('\n').forEach((line) => {
    if ((currentChunk + line).length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function fetchVintedItems() {
  const url = 'https://www.vinted.com/catalog?search_text=vetements';
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.feed-grid__item', { timeout: 10000 });

   // Extract the items
   const items = await page.$$eval('.feed-grid__item-content', elements => {
    return elements.map(element => {
      const titleElement = element.querySelector('[data-testid$="--description-title"]');
      const sizeElement = element.querySelector('[data-testid$="--description-subtitle"]');
      const priceElement = element.querySelector('[data-testid$="--price-text"]');
      const imageElement = element.querySelector('[data-testid$="--image--img"]');
      const linkElement = element.querySelector('a.new-item-box__overlay');

      const title = titleElement ? titleElement.innerText.trim() : null;
      const size = sizeElement ? sizeElement.innerText.trim() : null;
      const price = priceElement ? priceElement.innerText.trim() : null;
      const imageUrl = imageElement ? imageElement.src : null;
      const itemUrl = linkElement ? linkElement.href : null;

      return { title, size, price, imageUrl, itemUrl };
    });
  });

  console.log(items);
  return items;
  } catch (error) {
    console.error('Error scraping Vinted:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}
