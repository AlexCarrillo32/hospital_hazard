import express from 'express';
import { createManifest, trackManifest } from '../services/manifestGenerator.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { wasteProfile, facility, route } = req.body;

    if (!wasteProfile || !facility || !route) {
      return res.status(400).json({ error: 'Waste profile, facility, and route are required' });
    }

    const manifest = await createManifest(wasteProfile, facility, route);
    return res.status(201).json(manifest);
  } catch (error) {
    return next(error);
  }
});

router.get('/:manifestId', async (req, res, next) => {
  try {
    const { manifestId } = req.params;
    const manifestStatus = await trackManifest(manifestId);
    res.json(manifestStatus);
  } catch (error) {
    next(error);
  }
});

export default router;
