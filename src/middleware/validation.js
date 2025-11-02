import { body, param, query, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('validation');

/**
 * Middleware to handle validation errors
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    logger.warn(
      {
        path: req.path,
        method: req.method,
        errors: errorDetails,
      },
      'Validation failed'
    );

    return res.status(400).json({
      error: 'Validation failed',
      details: errorDetails,
    });
  }

  return next();
}

/**
 * Common validation rules
 */
export const validators = {
  // Waste Profile validators
  wasteProfile: {
    create: [
      body('wasteName')
        .trim()
        .notEmpty()
        .withMessage('Waste name is required')
        .isLength({ max: 200 })
        .withMessage('Waste name must not exceed 200 characters'),

      body('wasteCode')
        .optional()
        .trim()
        .matches(/^[A-Z]\d{3}$/)
        .withMessage('Waste code must be in format: letter followed by 3 digits (e.g., D001)'),

      body('physicalState')
        .optional()
        .isIn(['solid', 'liquid', 'gas', 'sludge'])
        .withMessage('Physical state must be: solid, liquid, gas, or sludge'),

      body('quantity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Quantity must be a positive number'),

      body('containerType')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Container type must not exceed 100 characters'),
    ],

    update: [
      param('id').isUUID().withMessage('Invalid profile ID format'),

      body('wasteName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Waste name cannot be empty')
        .isLength({ max: 200 })
        .withMessage('Waste name must not exceed 200 characters'),

      body('wasteCode')
        .optional()
        .trim()
        .matches(/^[A-Z]\d{3}$/)
        .withMessage('Waste code must be in format: letter followed by 3 digits'),

      body('physicalState')
        .optional()
        .isIn(['solid', 'liquid', 'gas', 'sludge'])
        .withMessage('Physical state must be: solid, liquid, gas, or sludge'),

      body('quantity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Quantity must be a positive number'),
    ],
  },

  // Facility validators
  facility: {
    create: [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Facility name is required')
        .isLength({ max: 200 })
        .withMessage('Facility name must not exceed 200 characters'),

      body('epaId')
        .optional()
        .trim()
        .matches(/^[A-Z]{3}\d{9}$/)
        .withMessage('EPA ID must be 3 letters followed by 9 digits'),

      body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must not exceed 500 characters'),

      body('city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('City must not exceed 100 characters'),

      body('state')
        .optional()
        .trim()
        .isLength({ min: 2, max: 2 })
        .withMessage('State must be 2-letter code'),

      body('zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Zip code must be 5 digits or 5+4 format'),

      body('phone')
        .optional()
        .trim()
        .matches(/^\+?[\d\s\-().]+$/)
        .withMessage('Invalid phone number format'),

      body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    ],

    update: [
      param('id').isUUID().withMessage('Invalid facility ID format'),

      body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Facility name cannot be empty')
        .isLength({ max: 200 })
        .withMessage('Facility name must not exceed 200 characters'),

      body('epaId')
        .optional()
        .trim()
        .matches(/^[A-Z]{3}\d{9}$/)
        .withMessage('EPA ID must be 3 letters followed by 9 digits'),

      body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    ],
  },

  // Manifest validators
  manifest: {
    create: [
      body('generatorId')
        .notEmpty()
        .withMessage('Generator ID is required')
        .isUUID()
        .withMessage('Invalid generator ID format'),

      body('transporterId')
        .notEmpty()
        .withMessage('Transporter ID is required')
        .isUUID()
        .withMessage('Invalid transporter ID format'),

      body('facilityId')
        .notEmpty()
        .withMessage('Facility ID is required')
        .isUUID()
        .withMessage('Invalid facility ID format'),

      body('wasteProfileIds')
        .isArray({ min: 1 })
        .withMessage('At least one waste profile ID is required'),

      body('wasteProfileIds.*').isUUID().withMessage('Each waste profile ID must be a valid UUID'),

      body('shipmentDate')
        .optional()
        .isISO8601()
        .withMessage('Shipment date must be in ISO 8601 format'),
    ],

    get: [param('id').isUUID().withMessage('Invalid manifest ID format')],
  },

  // Pagination validators
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // Common ID validator
  uuid: [param('id').isUUID().withMessage('Invalid ID format')],
};

/**
 * Sanitization middleware for common XSS prevention
 */
export function sanitizeInputs(req, _res, next) {
  // Strip dangerous HTML/script tags from all string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeValue(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }

  return next();
}
