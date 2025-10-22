import { createLogger } from '../utils/logger.js';

const logger = createLogger('error-handler');

export function errorHandler(err, _req, res, _next) {
  logger.error({ err }, 'Request error');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
