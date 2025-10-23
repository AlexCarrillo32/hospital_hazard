import express from 'express';
import { classifyWaste, generateWasteProfile } from '../services/wasteClassifier.js';

const router = express.Router();

router.post('/classify', async (req, res, next) => {
  try {
    const { labReportText } = req.body;

    if (!labReportText) {
      return res.status(400).json({ error: 'Lab report text is required' });
    }

    const classification = await classifyWaste(labReportText);
    return res.json(classification);
  } catch (error) {
    return next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const { classificationResult } = req.body;

    if (!classificationResult) {
      return res.status(400).json({ error: 'Classification result is required' });
    }

    const profile = await generateWasteProfile(classificationResult);
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
});

export default router;
