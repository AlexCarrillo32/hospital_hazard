import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('http');

export function requestLogger(req, res, next) {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request start
  const startTime = Date.now();

  logger.info(
    {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Incoming request'
  );

  // Capture original res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const duration = Date.now() - startTime;

    logger.info(
      {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );

    return originalJson(body);
  };

  // Log errors
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (res.statusCode >= 400) {
      logger.warn(
        {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        },
        'Request completed with error'
      );
    }
  });

  next();
}
