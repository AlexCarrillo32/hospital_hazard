import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import {
  queryAuditTrail,
  getResourceAuditTrail,
  getPendingReviews,
  recordHumanReview,
  generateAuditReport,
} from '../services/auditService.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('audit-routes');

/**
 * Query audit trail with filters
 * GET /api/audit?eventType=waste_classification&limit=50
 */
router.get(
  '/',
  [
    query('eventType').optional().isString(),
    query('resourceType').optional().isString(),
    query('userId').optional().isString(),
    query('wasteCode').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('requiresReview').optional().isBoolean().toBoolean(),
    query('status').optional().isIn(['pending_review', 'approved', 'rejected', 'completed']),
    query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const filters = {
        eventType: req.query.eventType,
        resourceType: req.query.resourceType,
        userId: req.query.userId,
        wasteCode: req.query.wasteCode,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        requiresReview: req.query.requiresReview,
        status: req.query.status,
        limit: req.query.limit || 100,
        offset: req.query.offset || 0,
      };

      const results = await queryAuditTrail(filters);

      return res.json({
        count: results.length,
        filters,
        results,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get audit trail for specific resource
 * GET /api/audit/resource/:resourceType/:resourceId
 */
router.get(
  '/resource/:resourceType/:resourceId',
  [param('resourceType').isString().notEmpty(), param('resourceId').isString().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { resourceType, resourceId } = req.params;

      const results = await getResourceAuditTrail(resourceType, resourceId);

      return res.json({
        resourceType,
        resourceId,
        count: results.length,
        auditTrail: results,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get items pending human review
 * GET /api/audit/pending-reviews?limit=50
 */
router.get(
  '/pending-reviews',
  [
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const options = {
        limit: req.query.limit || 50,
        offset: req.query.offset || 0,
      };

      const results = await getPendingReviews(options);

      return res.json({
        count: results.length,
        pendingReviews: results,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Submit human review for an audit entry
 * POST /api/audit/:auditId/review
 */
router.post(
  '/:auditId/review',
  [
    param('auditId').isUUID(),
    body('reviewedBy').isString().notEmpty(),
    body('approved').isBoolean(),
    body('notes').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { auditId } = req.params;
      const reviewData = {
        reviewedBy: req.body.reviewedBy,
        approved: req.body.approved,
        notes: req.body.notes,
      };

      await recordHumanReview(auditId, reviewData);

      logger.info(
        {
          auditId,
          reviewedBy: reviewData.reviewedBy,
          approved: reviewData.approved,
        },
        'Human review submitted'
      );

      return res.json({
        success: true,
        message: 'Review recorded successfully',
        auditId,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Generate audit report for date range
 * POST /api/audit/report
 */
router.post(
  '/report',
  [body('startDate').isISO8601().toDate(), body('endDate').isISO8601().toDate()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { startDate, endDate } = req.body;

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          error: 'Invalid date range',
          message: 'startDate must be before endDate',
        });
      }

      const report = await generateAuditReport(startDate, endDate);

      logger.info(
        {
          startDate,
          endDate,
          totalEvents: report.summary.total_events,
        },
        'Audit report generated'
      );

      return res.json(report);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * Get audit statistics summary
 * GET /api/audit/stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Get stats for last 30 days by default
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const report = await generateAuditReport(startDate, endDate);

    return res.json({
      period: '30_days',
      ...report.summary,
      topEvents: report.eventBreakdown.slice(0, 5),
      topWasteCodes: report.wasteCodeBreakdown.slice(0, 5),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
