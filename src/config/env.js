import dotenv from 'dotenv';
import { createLogger } from '../utils/logger.js';

dotenv.config();

const logger = createLogger('config');

const envSchema = {
  // Server Configuration
  NODE_ENV: {
    type: 'string',
    required: false,
    default: 'development',
    enum: ['development', 'production', 'test'],
  },
  PORT: {
    type: 'number',
    required: false,
    default: 3000,
    validator: (val) => val > 0 && val < 65536,
    errorMessage: 'PORT must be between 1 and 65535',
  },

  // Database Configuration
  DB_HOST: {
    type: 'string',
    required: false,
    default: 'localhost',
  },
  DB_PORT: {
    type: 'number',
    required: false,
    default: 5432,
  },
  DB_NAME: {
    type: 'string',
    required: false,
    default: 'waste_compliance',
  },
  DB_USER: {
    type: 'string',
    required: false,
    default: 'postgres',
  },
  DB_PASSWORD: {
    type: 'string',
    required: false,
    default: '',
  },

  // AI Service Configuration
  AI_MOCK_MODE: {
    type: 'boolean',
    required: false,
    default: true,
  },
  MODEL_ENDPOINT: {
    type: 'url',
    required: false,
    default: null,
  },
  ANTHROPIC_API_KEY: {
    type: 'string',
    required: false,
    default: null,
    sensitive: true,
  },

  // Logging Configuration
  LOG_LEVEL: {
    type: 'string',
    required: false,
    default: 'info',
    enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
  },

  // CORS Configuration
  ALLOWED_ORIGINS: {
    type: 'string',
    required: false,
    default: 'http://localhost:3000',
  },

  // API Security
  API_KEY_SALT: {
    type: 'string',
    required: false,
    default: null,
    sensitive: true,
  },

  // SSL/TLS Configuration
  SSL_ENABLED: {
    type: 'boolean',
    required: false,
    default: false,
  },
  SSL_CERT_PATH: {
    type: 'string',
    required: false,
    default: null,
  },
  SSL_KEY_PATH: {
    type: 'string',
    required: false,
    default: null,
  },
  SSL_CA_PATH: {
    type: 'string',
    required: false,
    default: null,
  },
  HTTP_REDIRECT: {
    type: 'boolean',
    required: false,
    default: false,
  },
  HTTP_PORT: {
    type: 'number',
    required: false,
    default: 80,
  },
};

function parseValue(value, type) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === true;
    case 'url':
      return value;
    default:
      return value;
  }
}

function validateEnv() {
  const errors = [];
  const warnings = [];
  const config = {};

  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return Object.entries(envSchema).reduce((acc, [key, schema]) => {
      acc[key] =
        process.env[key] !== undefined ? parseValue(process.env[key], schema.type) : schema.default;
      return acc;
    }, {});
  }

  for (const [key, schema] of Object.entries(envSchema)) {
    const rawValue = process.env[key];
    let value = parseValue(rawValue, schema.type);

    // Apply default if value is null
    if (value === null && schema.default !== undefined) {
      value = schema.default;
      if (!schema.sensitive) {
        logger.debug({ key, default: value }, 'Using default value for env var');
      }
    }

    // Check required
    if (schema.required && value === null) {
      errors.push(`Required environment variable ${key} is not set`);
      continue;
    }

    // Validate enum
    if (schema.enum && value !== null && !schema.enum.includes(value)) {
      errors.push(
        `Environment variable ${key} must be one of: ${schema.enum.join(', ')}. Got: ${value}`
      );
      continue;
    }

    // Custom validator
    if (schema.validator && value !== null) {
      if (!schema.validator(value)) {
        errors.push(schema.errorMessage || `Invalid value for ${key}: ${value}`);
        continue;
      }
    }

    // Type validation for URL
    if (schema.type === 'url' && value !== null) {
      try {
        new URL(value);
      } catch {
        errors.push(`Environment variable ${key} must be a valid URL. Got: ${value}`);
        continue;
      }
    }

    // Warnings for production
    if (process.env.NODE_ENV === 'production') {
      if (key === 'AI_MOCK_MODE' && value === true) {
        warnings.push('AI_MOCK_MODE is enabled in production environment');
      }
      if (key === 'DB_PASSWORD' && (!value || value === '')) {
        warnings.push('DB_PASSWORD is not set in production environment');
      }
    }

    config[key] = value;
  }

  // Report errors
  if (errors.length > 0) {
    logger.error({ errors }, 'Environment validation failed');
    errors.forEach((error) => console.error(`❌ ${error}`));
    throw new Error(`Environment validation failed with ${errors.length} error(s)`);
  }

  // Report warnings
  if (warnings.length > 0) {
    logger.warn({ warnings }, 'Environment validation warnings');
    warnings.forEach((warning) => console.warn(`⚠️  ${warning}`));
  }

  // Log configuration (mask sensitive values)
  const maskedConfig = Object.entries(config).reduce((acc, [key, value]) => {
    const schema = envSchema[key];
    acc[key] = schema.sensitive && value ? '***REDACTED***' : value;
    return acc;
  }, {});

  logger.info({ config: maskedConfig }, 'Environment configuration validated successfully');

  return config;
}

export function getConfig() {
  return validateEnv();
}

export default getConfig();
