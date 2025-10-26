import { recordAudit } from '../services/auditService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('audit-logger');

/**
 * Audit logging middleware
 * Automatically logs API requests for compliance tracking
 */
export function auditLogger(options = {}) {
  const { eventType = 'api_request', includeBody = false } = options;

  return async (req, res, next) => {
    const startTime = Date.now();

    // Capture original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Record audit asynchronously (don't block response)
      recordAuditEntry(req, res, body, duration, eventType, includeBody).catch((error) => {
        logger.error({ error: error.message }, 'Failed to record audit entry');
      });

      return originalJson(body);
    };

    return next();
  };
}

/**
 * Record audit entry for request/response
 */
async function recordAuditEntry(req, res, _responseBody, duration, eventType, includeBody) {
  try {
    const auditEntry = {
      eventType,
      action: req.method.toLowerCase(),
      resourceType: extractResourceType(req.path),
      resourceId: req.params.id || req.params.manifestId || null,
      userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
      userEmail: req.user?.email || req.headers['x-user-email'],
      userRole: req.user?.role || 'user',
      ipAddress: req.ip || req.connection.remoteAddress,
      traceId: req.headers['x-trace-id'] || `req-${Date.now()}`,
      requestData: includeBody
        ? {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeRequestBody(req.body),
          }
        : {
            method: req.method,
            path: req.path,
            query: req.query,
          },
      responseData: {
        statusCode: res.statusCode,
        duration,
      },
      metadata: {
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer,
        duration,
      },
      status: res.statusCode >= 200 && res.statusCode < 300 ? 'completed' : 'failed',
      sessionId: req.session?.id || req.headers['x-session-id'],
      requestId: req.id || req.headers['x-request-id'],
    };

    await recordAudit(auditEntry);
  } catch (error) {
    logger.error({ error: error.message }, 'Error recording audit entry');
  }
}

/**
 * Extract resource type from request path
 */
function extractResourceType(path) {
  const pathSegments = path.split('/').filter(Boolean);

  if (pathSegments.includes('waste-profiles')) {
    return 'waste_profile';
  }

  if (pathSegments.includes('facilities')) {
    return 'facility';
  }

  if (pathSegments.includes('manifests')) {
    return 'manifest';
  }

  if (pathSegments.includes('generators')) {
    return 'generator';
  }

  return 'unknown';
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard', 'api_key'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Audit specific waste classification action
 */
export function auditClassification() {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      // If classification was successful, record detailed audit
      if (body && body.wasteCode) {
        const { recordClassificationAudit } = await import('../services/auditService.js');

        recordClassificationAudit(body, {
          userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
          userEmail: req.user?.email,
          userRole: req.user?.role || 'user',
          ipAddress: req.ip,
          sessionId: req.session?.id,
          requestId: req.id,
        }).catch((error) => {
          logger.error({ error: error.message }, 'Failed to record classification audit');
        });
      }

      return originalJson(body);
    };

    return next();
  };
}

/**
 * Audit waste profile generation
 */
export function auditProfileGeneration() {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      // If profile was generated, record detailed audit
      if (body && body.wasteCode && body.profileDocument) {
        const { recordProfileGenerationAudit } = await import('../services/auditService.js');

        recordProfileGenerationAudit(body, {
          userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
          userEmail: req.user?.email,
          userRole: req.user?.role || 'user',
          ipAddress: req.ip,
          sessionId: req.session?.id,
          requestId: req.id,
        }).catch((error) => {
          logger.error({ error: error.message }, 'Failed to record profile generation audit');
        });
      }

      return originalJson(body);
    };

    return next();
  };
}
