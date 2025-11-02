import express from 'express';
import { body } from 'express-validator';
import { classifyWaste, generateWasteProfile } from '../services/wasteClassifier.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { auditClassification, auditProfileGeneration } from '../middleware/auditLogger.js';

const router = express.Router();

router.post(
  '/classify',
  [
    body('labReportText')
      .trim()
      .notEmpty()
      .withMessage('Lab report text is required')
      .isLength({ min: 10, max: 50000 })
      .withMessage('Lab report text must be between 10 and 50000 characters'),
    handleValidationErrors,
  ],
  auditClassification(),
  async (req, res, next) => {
    try {
      const { labReportText } = req.body;
      const classification = await classifyWaste(labReportText);
      return res.json(classification);
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/generate',
  [
    body('classificationResult')
      .notEmpty()
      .withMessage('Classification result is required')
      .isObject()
      .withMessage('Classification result must be an object'),
    handleValidationErrors,
  ],
  auditProfileGeneration(),
  async (req, res, next) => {
    try {
      const { classificationResult } = req.body;
      const profile = await generateWasteProfile(classificationResult);
      return res.json(profile);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
