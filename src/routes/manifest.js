import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createManifest,
  trackManifest,
  getAllManifests,
  getManifestById,
  updateManifestStatus,
  signManifest,
  deleteManifest,
} from '../services/manifestGenerator.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/**
 * Create new manifest
 * POST /api/manifests
 */
router.post(
  '/',
  [
    body('wasteProfile').notEmpty().isObject().withMessage('Waste profile is required'),
    body('facility').notEmpty().isObject().withMessage('Facility is required'),
    body('route').notEmpty().isObject().withMessage('Route is required'),
    body('generatorInfo').optional().isObject(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { wasteProfile, facility, route, generatorInfo } = req.body;
      const manifest = await createManifest(wasteProfile, facility, route, { generatorInfo });
      return res.status(201).json(manifest);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get all manifests with optional filters
 * GET /api/manifests?status=draft&limit=50&offset=0
 */
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['draft', 'submitted', 'in_transit', 'delivered', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query;
      const manifests = await getAllManifests({ status, limit, offset });
      return res.json({
        count: manifests.length,
        manifests,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get manifest by ID
 * GET /api/manifests/:manifestId
 */
router.get(
  '/:manifestId',
  [param('manifestId').isUUID().withMessage('Invalid manifest ID format'), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { manifestId } = req.params;
      const manifest = await getManifestById(manifestId);

      if (!manifest) {
        return res.status(404).json({
          error: 'Manifest not found',
          manifestId,
        });
      }

      return res.json(manifest);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Track manifest (get tracking info)
 * GET /api/manifests/:manifestId/track
 */
router.get(
  '/:manifestId/track',
  [param('manifestId').isUUID().withMessage('Invalid manifest ID format'), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { manifestId } = req.params;
      const tracking = await trackManifest(manifestId);
      return res.json(tracking);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Update manifest status
 * PUT /api/manifests/:manifestId/status
 */
router.put(
  '/:manifestId/status',
  [
    param('manifestId').isUUID().withMessage('Invalid manifest ID format'),
    body('status')
      .isIn(['draft', 'submitted', 'in_transit', 'delivered', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('actor').isString().notEmpty().withMessage('Actor is required'),
    body('details').optional().isObject(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { manifestId } = req.params;
      const { status, actor, details } = req.body;
      const manifest = await updateManifestStatus(manifestId, status, actor, details);
      return res.json(manifest);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Sign manifest
 * POST /api/manifests/:manifestId/sign
 */
router.post(
  '/:manifestId/sign',
  [
    param('manifestId').isUUID().withMessage('Invalid manifest ID format'),
    body('role')
      .isIn(['generator', 'transporter', 'facility'])
      .withMessage('Invalid role. Must be: generator, transporter, or facility'),
    body('name').isString().notEmpty().withMessage('Signer name is required'),
    body('signature').optional().isString(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { manifestId } = req.params;
      const { role, name, signature } = req.body;
      const manifest = await signManifest(manifestId, role, { name, signature });
      return res.json(manifest);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Delete manifest (only draft or cancelled)
 * DELETE /api/manifests/:manifestId
 */
router.delete(
  '/:manifestId',
  [param('manifestId').isUUID().withMessage('Invalid manifest ID format'), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { manifestId } = req.params;
      await deleteManifest(manifestId);
      return res.json({
        success: true,
        message: 'Manifest deleted successfully',
        manifestId,
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
