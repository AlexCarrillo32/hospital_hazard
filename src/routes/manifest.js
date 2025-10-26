import express from 'express';
import { body, param } from 'express-validator';
import { createManifest, trackManifest } from '../services/manifestGenerator.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post(
  '/',
  [
    body('wasteProfile')
      .notEmpty()
      .withMessage('Waste profile is required')
      .isObject()
      .withMessage('Waste profile must be an object'),
    body('facility')
      .notEmpty()
      .withMessage('Facility is required')
      .isObject()
      .withMessage('Facility must be an object'),
    body('route')
      .notEmpty()
      .withMessage('Route is required')
      .isObject()
      .withMessage('Route must be an object'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { wasteProfile, facility, route } = req.body;
      const manifest = await createManifest(wasteProfile, facility, route);
      return res.status(201).json(manifest);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  '/:manifestId',
  [
    param('manifestId')
      .trim()
      .notEmpty()
      .withMessage('Manifest ID is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Invalid manifest ID format'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { manifestId } = req.params;
      const manifestStatus = await trackManifest(manifestId);
      res.json(manifestStatus);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
