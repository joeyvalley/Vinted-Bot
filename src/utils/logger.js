import fs from 'fs';
import path from 'path';

const { LOG_LEVEL = 'info' } = process.env;

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const logFile = path.join(process.cwd(), 'logs/app.log');

function log(level, message) {
    if (logLevels[level] > logLevels[LOG_LEVEL]) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // Console logging
    console[level](logMessage.trim());
    
    // File logging
    fs.appendFileSync(logFile, logMessage);
}

export const logger = {
    error: (message) => log('error', message),
    warn: (message) => log('warn', message),
    info: (message) => log('info', message),
    debug: (message) => log('debug', message)
};
