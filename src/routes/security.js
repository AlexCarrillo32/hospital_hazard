import express from 'express';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('security');

/**
 * CSP Violation Reporting Endpoint
 * Receives and logs Content Security Policy violations
 */
router.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body;

  logger.warn(
    {
      cspReport: report,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'CSP Violation Reported'
  );

  // In production, you might want to:
  // 1. Store violations in database for analysis
  // 2. Send alerts for critical violations
  // 3. Aggregate violations by type

  res.status(204).send(); // No content response
});

export default router;
