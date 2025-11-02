import express from 'express';
import { body, query } from 'express-validator';
import { findApprovedFacilities, calculateOptimalRoute } from '../services/facilityMatcher.js';
import {
  searchFacilitiesByLocation,
  findOptimalFacility,
  getFacilitiesByWasteCode,
  getFacilityById,
} from '../services/facilitySearch.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post('/search', async (req, res, next) => {
  try {
    const { wasteProfile } = req.body;

    if (!wasteProfile) {
      return res.status(400).json({ error: 'Waste profile is required' });
    }

    const facilities = await findApprovedFacilities(wasteProfile);
    return res.json(facilities);
  } catch (error) {
    return next(error);
  }
});

router.post('/route', async (req, res, next) => {
  try {
    const { wasteProfile, facilities } = req.body;

    if (!wasteProfile || !facilities) {
      return res.status(400).json({ error: 'Waste profile and facilities are required' });
    }

    const route = await calculateOptimalRoute(wasteProfile, facilities);
    return res.json(route);
  } catch (error) {
    return next(error);
  }
});

/**
 * Geographic search for facilities near a location
 * POST /api/facilities/search/location
 */
router.post(
  '/search/location',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('maxDistanceKm')
      .optional()
      .isInt({ min: 1, max: 5000 })
      .withMessage('Max distance must be 1-5000 km'),
    body('wasteCode').optional().isString(),
    body('minCapacity').optional().isInt({ min: 0 }),
    body('minRating').optional().isFloat({ min: 0, max: 5 }),
    body('state').optional().isString().isLength({ min: 2, max: 2 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const facilities = await searchFacilitiesByLocation(req.body);
      return res.json({
        count: facilities.length,
        facilities,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Find optimal facility based on criteria
 * POST /api/facilities/optimal
 */
router.post(
  '/optimal',
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('wasteCode').isString().notEmpty(),
    body('quantity_kg').isInt({ min: 1 }),
    body('priority').optional().isIn(['cost', 'distance', 'rating', 'balanced']),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const facility = await findOptimalFacility(req.body);

      if (!facility) {
        return res.status(404).json({
          error: 'No suitable facility found',
          message: 'No facilities match the specified criteria',
        });
      }

      return res.json(facility);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get facilities by waste code
 * GET /api/facilities/waste-code/:wasteCode
 */
router.get(
  '/waste-code/:wasteCode',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('state').optional().isString().isLength({ min: 2, max: 2 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { wasteCode } = req.params;
      const options = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
        state: req.query.state,
      };

      const facilities = await getFacilitiesByWasteCode(wasteCode, options);

      return res.json({
        wasteCode,
        count: facilities.length,
        facilities,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get facility by ID
 * GET /api/facilities/:facilityId
 */
router.get('/:facilityId', async (req, res, next) => {
  try {
    const { facilityId } = req.params;
    const facility = await getFacilityById(facilityId);

    if (!facility) {
      return res.status(404).json({
        error: 'Facility not found',
        message: `No facility found with ID: ${facilityId}`,
      });
    }

    return res.json(facility);
  } catch (error) {
    return next(error);
  }
});

export default router;
