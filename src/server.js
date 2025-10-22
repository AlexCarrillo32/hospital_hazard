import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger.js';
import wasteProfileRoutes from './routes/wasteProfile.js';
import facilityRoutes from './routes/facility.js';
import manifestRoutes from './routes/manifest.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const logger = createLogger('server');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/waste-profiles', wasteProfileRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/manifests', manifestRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Waste Compliance Agent running on port ${PORT}`);
  });
}

export default app;
