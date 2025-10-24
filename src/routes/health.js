import express from 'express';
import { getPool } from '../db/connection.js';
import config from '../config/env.js';

const router = express.Router();
const startTime = Date.now();

// Basic health check - liveness probe
router.get('/', (_req, res) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// Readiness check - includes dependency health
router.get('/ready', async (_req, res) => {
  const checks = {
    server: 'healthy',
    database: 'unknown',
    ai: 'unknown',
  };

  try {
    // Check database connection
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      checks.database = 'healthy';
    } catch (dbError) {
      checks.database = 'unhealthy';
    }

    // Check AI service availability
    checks.ai = config.AI_MOCK_MODE ? 'mock-mode' : 'configured';

    const isHealthy = checks.database === 'healthy';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
      checks,
    });
  }
});

// Database health check
router.get('/db', async (_req, res) => {
  try {
    const pool = getPool();
    const start = Date.now();
    await pool.query('SELECT 1 AS health_check');
    const latency = Date.now() - start;

    return res.json({
      status: 'healthy',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// AI service health check
router.get('/ai', (_req, res) => {
  const aiStatus = {
    mode: config.AI_MOCK_MODE ? 'mock' : 'production',
    endpoint: config.MODEL_ENDPOINT || 'not-configured',
    configured: !config.AI_MOCK_MODE && !!config.ANTHROPIC_API_KEY,
  };

  return res.json({
    status: config.AI_MOCK_MODE || aiStatus.configured ? 'available' : 'not-configured',
    ...aiStatus,
    timestamp: new Date().toISOString(),
  });
});

// System information
router.get('/info', (_req, res) => {
  return res.json({
    version: process.env.npm_package_version || '1.0.0',
    environment: config.NODE_ENV,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    node: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  });
});

export default router;
