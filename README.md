# Vinted Bot

A TypeScript-based monitoring bot for Vinted that tracks new items and caches them using Redis.

## Features

- Real-time monitoring of Vinted items
- Redis-based caching to track seen items
- Rate limiting to respect Vinted's API limits
- Proxy support for distributed requests
- Configurable search parameters
- Graceful error handling and logging
- Automatic cleanup of old cached items

## Prerequisites

- Node.js 18 or higher
- Redis server
- (Optional) HTTP proxy for distributed requests

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vinted-bot.git
cd vinted-bot
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file and fill in your values:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
REDIS_URL=redis://localhost:6379
PROXY_URL=your_proxy_url (optional)
PROXY_USERNAME=proxy_username (optional)
PROXY_PASSWORD=proxy_password (optional)
VINTED_API_KEY=your_api_key
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Production

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Architecture

The bot is built with a modular architecture:

- `src/services/vintedService.ts`: Handles Vinted API interactions
- `src/services/itemTracker.ts`: Manages Redis caching of items
- `src/core/executionEngine.ts`: Coordinates the monitoring process
- `src/utils/logger.ts`: Provides logging functionality

## Configuration

The bot can be configured through environment variables and code:

- Search parameters can be modified in `src/core/executionEngine.ts`
- Caching TTL can be adjusted in `src/services/itemTracker.ts`
- Rate limiting can be configured in `src/services/vintedService.ts`

## Error Handling

The bot implements comprehensive error handling:

- API request failures
- Redis connection issues
- Rate limiting errors
- Network timeouts

All errors are logged with appropriate context for debugging.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

Joey Valley - [@joeyvalley](https://github.com/joeyvalley)

Project Link: [https://github.com/joeyvalley/Vinted-Bot](https://github.com/joeyvalley/Vinted-Bot)
