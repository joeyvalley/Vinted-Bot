# Vinted Bot

A Telegram bot for monitoring and purchasing items on Vinted marketplace.

## Features
- Real-time item monitoring
- Automated purchase capabilities
- Customizable search filters
- Notification system via Telegram
- Rate limiting and activity tracking

## Installation

1. Clone the repository:
```bash
git clone https://github.com/joeyvalley/Vinted-Bot.git
cd Vinted-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Configuration

Create a `userConfig.json` file with your preferences:
```json
{
  "searchQueries": [
    {
      "query": "nike air max",
      "maxPrice": 100,
      "size": "42"
    }
  ],
  "notificationSettings": {
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN",
      "chatId": "YOUR_CHAT_ID"
    }
  }
}
```

## Usage

Start the bot:
```bash
npm start
```

The bot will:
1. Monitor Vinted for new items matching your search queries
2. Send notifications via Telegram when matches are found
3. Automatically purchase items based on your configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Joey Valley - [@joeyvalley](https://github.com/joeyvalley)

Project Link: [https://github.com/joeyvalley/Vinted-Bot](https://github.com/joeyvalley/Vinted-Bot)
