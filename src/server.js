import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import { createLogger } from './utils/logger.js';
import { apiLimiter, strictLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { securityHeaders, jsonSanitizer } from './middleware/security.js';
import wasteProfileRoutes from './routes/wasteProfile.js';
import facilityRoutes from './routes/facility.js';
import manifestRoutes from './routes/manifest.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const logger = createLogger('server');
const PORT = config.PORT;

// Security middleware
app.use(securityHeaders);
app.use(cors());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON sanitization
app.use(jsonSanitizer);

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
