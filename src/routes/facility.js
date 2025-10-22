import express from 'express';
import {
  findApprovedFacilities,
  calculateOptimalRoute,
} from '../services/facilityMatcher.js';

const router = express.Router();

router.post('/search', async (req, res, next) => {
  try {
    const { wasteProfile } = req.body;

    if (!wasteProfile) {
      return res.status(400).json({ error: 'Waste profile is required' });
    }

    const facilities = await findApprovedFacilities(wasteProfile);
    res.json(facilities);
  } catch (error) {
    next(error);
  }
});

router.post('/route', async (req, res, next) => {
  try {
    const { wasteProfile, facilities } = req.body;

    if (!wasteProfile || !facilities) {
      return res
        .status(400)
        .json({ error: 'Waste profile and facilities are required' });
    }

    const route = await calculateOptimalRoute(wasteProfile, facilities);
    res.json(route);
  } catch (error) {
    next(error);
  }
});

export default router;
