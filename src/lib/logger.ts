import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'citizenship-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // In production, add file transport
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;

// Structured logging functions
export const logEvent = (event: string, data: Record<string, any>) => {
  logger.info('Event logged', { event, ...data });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Error occurred', { error: error.message, stack: error.stack, ...context });
};

export const logAudit = (action: string, userId: string, details: Record<string, any>) => {
  logger.info('Audit log', { action, userId, ...details });
};