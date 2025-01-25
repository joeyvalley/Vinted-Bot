# Setup

"Let's discuss a new software project. My goal is to build a bot that monitors the Vinted items route for new items and notifies users in real-time. It is designed to work with minimal delay, ensuring that users are always up-to-date with the latest items. it has to be implemented on telegram and using webshare proxies and scraping vinted via the API. it has to be in a docker image and be running on a OVH VPS with these specs:
Model: VPS vps2023-le-2
vCores: 2
Memory: 2 GB
Storage: 40 GB
Architecture: AMD64
OS: Debian 12 With Docker
 What are your initial thoughts on the tech stack, application architecture, and any scalability considerations we should keep in mind?"
 i want to use javascript
Inspirations for the bot are:
https://github.com/herissondev/vinted-api-wrapper
https://github.com/teddy-vltn/vinted-discord-bot



## todos

webshare proxies implementation via API key
OVH VPS implementaion
dockerized
https://github.com/herissondev/vinted-api-wrapper

## Server Specs 
Model: VPS vps2023-le-2
vCores: 2
Memory: 2 GB
Storage: 40 GB
Architecture: AMD64
OS: Debian 12 With Docker


## Tech Stack
	1.	Backend Framework
	•	Node.js: Ideal for handling real-time updates and integrating with Telegram's Bot API. It has excellent support for asynchronous operations and libraries like node-telegram-bot-api for Telegram bots.
	2.	Database
	•	Redis: For storing user preferences and recent items. It's lightweight and perfect for handling real-time data.
	•	PostgreSQL: For more complex queries and structured data storage, especially if you want to provide users with a history of items.
	•	MongoDB: If you prefer a NoSQL approach to flexibility.
	3.	Web Scraping
	•	Consider Vinted's API if available (official or unofficial) to reduce scraping overhead.
	4.	Hosting
    •   Vercel
	•	Use Telegram Bot API directly for notifications. Webhook mode is recommended for efficiency.
	•	If you want a separate queue for handling notifications, consider RabbitMQ or Kafka.
	6.	Monitoring and Logging
	•	Use Sentry or Elastic Stack for logging errors.
	•	Prometheus with Grafana for monitoring performance.