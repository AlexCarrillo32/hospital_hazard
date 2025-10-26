import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('http');

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'x-api-key',
  'cookie',
  'credit_card',
  'ssn',
];

/**
 * Redact sensitive data from objects before logging
 */
function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const redacted = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));

    if (isSensitive) {
      redacted[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export function requestLogger(req, res, next) {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request start
  const startTime = Date.now();

  // Redact sensitive headers
  const safeHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));
    if (isSensitive) {
      safeHeaders[key] = '***REDACTED***';
    } else {
      safeHeaders[key] = value;
    }
  }

  logger.info(
    {
      requestId,
      method: req.method,
      path: req.path,
      query: redactSensitiveData(req.query),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      headers: safeHeaders,
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
