import crypto from 'crypto';
import config from '../config/env.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth');

/**
 * Simple API Key authentication middleware
 * For production, consider using JWT or OAuth2
 */
export function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        method: req.method,
      },
      'API key missing'
    );

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Please provide X-API-Key header.',
    });
  }

  // In production, validate against database of hashed API keys
  // For now, we'll use a simple environment variable
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    logger.error('API_KEY not configured in environment');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Authentication is not properly configured',
    });
  }

  // Constant-time comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey);
  const validKeyBuffer = Buffer.from(validApiKey);

  if (
    apiKeyBuffer.length !== validKeyBuffer.length ||
    !crypto.timingSafeEqual(apiKeyBuffer, validKeyBuffer)
  ) {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        method: req.method,
      },
      'Invalid API key provided'
    );

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // API key is valid
  return next();
}

/**
 * Optional API Key middleware - allows unauthenticated requests
 * but adds user context if API key is provided
 */
export function optionalApiKey(req, _res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    req.authenticated = false;
    return next();
  }

  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    req.authenticated = false;
    return next();
  }

  const apiKeyBuffer = Buffer.from(apiKey);
  const validKeyBuffer = Buffer.from(validApiKey);

  if (
    apiKeyBuffer.length === validKeyBuffer.length &&
    crypto.timingSafeEqual(apiKeyBuffer, validKeyBuffer)
  ) {
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  return next();
}

/**
 * Generate a secure API key
 * Call this function to create API keys for your users
 */
export function generateApiKey() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash an API key for storage
 * Store hashed keys in database, never store plain text
 */
export function hashApiKey(apiKey) {
  const salt = config.API_KEY_SALT || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey, hash, salt) {
  const keyHash = crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(keyHash));
}

/**
 * Role-based access control middleware
 * For future implementation with user roles
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    // This is a placeholder for future role-based access control
    // In production, extract user role from JWT or session
    const userRole = req.user?.role || 'guest';

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userRole,
          allowedRoles,
        },
        'Access denied - insufficient permissions'
      );

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }

    return next();
  };
}
