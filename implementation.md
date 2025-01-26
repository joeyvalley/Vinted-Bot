# IMPLEMENTATION.md

## **Project Overview**
This project aims to build a Vinted monitoring bot that fetches new items from the Vinted API and notifies users in real-time via Telegram. The bot will be implemented in JavaScript, use Docker for containerization, and run on an OVH VPS with the following specifications:

- **Model**: VPS vps2023-le-2
- **vCores**: 2
- **Memory**: 2 GB
- **Storage**: 40 GB
- **Architecture**: AMD64
- **OS**: Debian 12

The architecture is modular, with distinct components for scraping, notification, caching, and configuration management. Redis will be used for caching, and Docker Compose will orchestrate services.

---

## **Development Phases**

### **Phase 1: Environment Setup**

#### **1. VPS Preparation**
1. Access the OVH VPS via SSH.
2. Update the system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. Install Docker and Docker Compose:
   ```bash
   sudo apt install docker.io docker-compose -y
   ```
4. Verify Docker installation:
   ```bash
   docker --version
   docker-compose --version
   ```
5. Install Node.js and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
6. Install Redis:
   ```bash
   sudo apt install redis-server -y
   sudo systemctl enable redis --now
   ```

#### **2. Local Development Setup**
1. Clone the project repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with placeholders for sensitive data:
   ```env
   TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
   VINTED_API_KEY=<vinted-api-key>
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   PROXY_URL=<webshare-proxy-url>
   ```

---

### **Phase 2: Initial Project Structure**

#### **1. Folder Structure**
```plaintext
project-folder/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── scraper/
│   │   └── scraper.js
│   ├── notifications/
│   │   └── telegram.js
│   ├── cache/
│   │   └── redis.js
│   ├── index.js
├── .env
├── Dockerfile
├── docker-compose.yml
├── package.json
├── README.md
```

#### **2. Initialize the Project**
1. Create a new Node.js project:
   ```bash
   npm init -y
   ```
2. Install required dependencies:
   ```bash
   npm install axios dotenv node-telegram-bot-api redis
   ```
3. Install development tools:
   ```bash
   npm install --save-dev nodemon eslint
   ```

---

### **Phase 3: Stub Modules**

#### **1. Scraper Module**
- **File**: `src/scraper/scraper.js`
- **Description**: Handles API requests to Vinted.
- **Stub Code**:
   ```javascript
   const axios = require('axios');
   const { PROXY_URL } = require('../config/env');

   async function fetchVintedItems(filters) {
       console.log('Fetching items with filters:', filters);
       // TODO: Add actual API call logic
       return [];
   }

   module.exports = { fetchVintedItems };
   ```

#### **2. Notification Module**
- **File**: `src/notifications/telegram.js`
- **Description**: Sends messages to Telegram users.
- **Stub Code**:
   ```javascript
   const TelegramBot = require('node-telegram-bot-api');
   const { TELEGRAM_BOT_TOKEN } = require('../config/env');

   const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

   bot.on('message', (msg) => {
       console.log(`Received message: ${msg.text}`);
       // TODO: Add command handling logic
   });

   function sendNotification(chatId, message) {
       console.log(`Sending notification to ${chatId}: ${message}`);
       // TODO: Add Telegram message logic
   }

   module.exports = { sendNotification };
   ```

#### **3. Cache Module**
- **File**: `src/cache/redis.js`
- **Description**: Manages caching using Redis.
- **Stub Code**:
   ```javascript
   const redis = require('redis');
   const { REDIS_HOST, REDIS_PORT } = require('../config/env');

   const client = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });

   client.on('error', (err) => console.error('Redis error:', err));

   async function setCache(key, value, ttl = 3600) {
       console.log(`Setting cache for key: ${key}`);
       // TODO: Add caching logic
   }

   async function getCache(key) {
       console.log(`Fetching cache for key: ${key}`);
       // TODO: Add retrieval logic
       return null;
   }

   module.exports = { setCache, getCache };
   ```

#### **4. Configuration Module**
- **File**: `src/config/env.js`
- **Description**: Loads environment variables.
- **Stub Code**:
   ```javascript
   require('dotenv').config();

   module.exports = {
       TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
       VINTED_API_KEY: process.env.VINTED_API_KEY,
       REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
       REDIS_PORT: process.env.REDIS_PORT || 6379,
       PROXY_URL: process.env.PROXY_URL,
   };
   ```

#### **5. Main Entry Point**
- **File**: `src/index.js`
- **Description**: Orchestrates the application.
- **Stub Code**:
   ```javascript
   const { fetchVintedItems } = require('./scraper/scraper');
   const { sendNotification } = require('./notifications/telegram');
   const { setCache, getCache } = require('./cache/redis');

   console.log('Bot started!');

   // Example workflow
   async function main() {
       const items = await fetchVintedItems({});
       console.log('Fetched items:', items);
       // TODO: Add logic to process and notify users
   }

   main();
   ```

---

### **Phase 4: Docker Configuration**

#### **1. Dockerfile**
```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
```

#### **2. Docker Compose File**
```yaml
version: '3.8'

services:
  bot:
    build: .
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - redis

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
```

---

### **Completed Features**

1. **Core Infrastructure**
   - Redis caching implementation
   - Error handling and logging system
   - Configuration management with schema validation
   - Docker deployment setup

2. **Bot Functionality**
   - Vinted API integration with advanced search filters
   - Result deduplication and matching logic
   - Telegram bot interface with /search command
   - User configuration persistence

3. **Notification System**
   - Cron-based scheduling
   - Notification tracking and retry logic
   - Telegram commands for schedule management
   - Integration with stats system

4. **Statistics and Analytics**
   - Usage statistics tracking
   - Stats dashboard implementation
   - Rate limiting and API protection
   - Admin reporting features

### **Next Steps**

1. **Production Deployment**
   - Finalize Docker configuration for production
   - Set up monitoring and alerting
   - Implement backup strategy for Redis data

2. **Documentation**
   - Create user documentation for bot commands
   - Write technical documentation for API integration
   - Add developer setup guide

3. **Future Improvements**
   - Add support for multiple languages
   - Implement advanced analytics dashboard
   - Add webhook support for Vinted API
   - Create admin web interface
