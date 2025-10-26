import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import { createLogger } from './utils/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { securityHeaders, jsonSanitizer } from './middleware/security.js';
import { sanitizeInputs } from './middleware/validation.js';
import healthRoutes from './routes/health.js';
import wasteProfileRoutes from './routes/wasteProfile.js';
import facilityRoutes from './routes/facility.js';
import manifestRoutes from './routes/manifest.js';
import securityRoutes from './routes/security.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const logger = createLogger('server');
const PORT = config.PORT;

// Security middleware
app.use(securityHeaders);

// CORS configuration with origin whitelist
const allowedOrigins = config.ALLOWED_ORIGINS
  ? config.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn({ origin, allowedOrigins }, 'CORS request blocked');
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    maxAge: 86400, // 24 hours
  })
);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON sanitization and input sanitization
app.use(jsonSanitizer);
app.use(sanitizeInputs);

// Routes
app.use('/health', healthRoutes);
app.use('/api', securityRoutes); // CSP reporting and other security endpoints
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
