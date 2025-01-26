import { config } from 'dotenv';
import { ExecutionEngine } from './core/executionEngine.js';
import { logger } from './utils/logger.js';

// Load environment variables
config();

const engine = new ExecutionEngine();

async function main() {
  try {
    await engine.initialize();
    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to start application', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Handle process events
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await engine.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await engine.stop();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason)
  });
  process.exit(1);
});

// Start the application
main(); 