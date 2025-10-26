import express from 'express';
import https from 'https';
import http from 'http';
import cors from 'cors';
import config from './config/env.js';
import { createLogger } from './utils/logger.js';
import { getSSLConfig } from './config/ssl.js';
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

// Start server (HTTP or HTTPS based on configuration)
if (process.env.NODE_ENV !== 'test') {
  try {
    const sslConfig = getSSLConfig();

    if (sslConfig) {
      // HTTPS server
      const httpsServer = https.createServer(sslConfig, app);
      httpsServer.listen(PORT, () => {
        logger.info(`🔒 Waste Compliance Agent running on HTTPS port ${PORT}`);
        logger.info('SSL/TLS enabled with secure configuration');
      });

      // Optional: Redirect HTTP to HTTPS
      if (process.env.HTTP_REDIRECT === 'true') {
        const HTTP_PORT = process.env.HTTP_PORT || 80;
        const httpApp = express();

        httpApp.use('*', (req, res) => {
          const host = req.headers.host?.replace(/:\d+$/, '');
          const redirectUrl = `https://${host}:${PORT}${req.url}`;
          logger.debug({ from: req.url, to: redirectUrl }, 'HTTP to HTTPS redirect');
          res.redirect(301, redirectUrl);
        });

        httpApp.listen(HTTP_PORT, () => {
          logger.info(`HTTP redirect server running on port ${HTTP_PORT} → HTTPS ${PORT}`);
        });
      }
    } else {
      // HTTP server (development only)
      const httpServer = http.createServer(app);
      httpServer.listen(PORT, () => {
        logger.info(`Waste Compliance Agent running on HTTP port ${PORT}`);
        logger.warn('⚠️  SSL/TLS is disabled - NOT SUITABLE FOR PRODUCTION');
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start server');
    process.exit(1);
  }
}

export default app;
