import { createLogger } from '../utils/logger.js';
import { getKnex as getDb } from '../db/connection.js';
import { randomUUID } from 'crypto';

const logger = createLogger('audit-service');

/**
 * Record an audit trail entry
 */
export async function recordAudit(auditEntry) {
  const {
    eventType,
    action,
    resourceType,
    resourceId,
    traceId,
    status = 'completed',
    metadata,
  } = auditEntry;

  // Validate required fields
  if (!eventType || !action || !resourceType) {
    throw new Error('Missing required audit fields: eventType, action, resourceType');
  }

  const db = getDb();

  const auditId = randomUUID();

  try {
    const [result] = await db('audit_trail')
      .insert({
        id: auditId,
        event_type: eventType,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        trace_id: traceId,
        status,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning('*');

    logger.info(
      {
        auditId: result.id,
        eventType,
        action,
        resourceType,
        traceId,
      },
      'Audit trail entry recorded'
    );

    return result;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        eventType,
        action,
        resourceType,
      },
      'Failed to record audit trail entry'
    );
    throw error;
  }
}

/**
 * Record AI classification audit
 */
export async function recordClassificationAudit(classification, options = {}) {
  return recordAudit({
    eventType: 'waste_classification',
    action: 'create',
    resourceType: 'classification',
    resourceId: classification.traceId,
    traceId: classification.traceId,
    aiModel: options.aiModel || 'claude-3-5-sonnet-20241022',
    confidenceScore: classification.confidence,
    requiresHumanReview: classification.requiresHumanReview,
    responseData: {
      wasteCode: classification.wasteCode,
      category: classification.category,
      confidence: classification.confidence,
      chemicalsDetected: classification.chemicalsDetected,
    },
    wasteCode: classification.wasteCode,
    regulationReference: getRCRAReference(classification.wasteCode),
    status: classification.requiresHumanReview ? 'pending_review' : 'completed',
    ...options,
  });
}

/**
 * Record waste profile generation audit
 */
export async function recordProfileGenerationAudit(profile, options = {}) {
  return recordAudit({
    eventType: 'profile_generation',
    action: 'create',
    resourceType: 'waste_profile',
    resourceId: profile.traceId,
    traceId: profile.traceId,
    aiModel: options.aiModel || 'claude-3-5-sonnet-20241022',
    responseData: {
      wasteCode: profile.wasteCode,
      category: profile.category,
      status: profile.status,
    },
    wasteCode: profile.wasteCode,
    regulationReference: getRCRAReference(profile.wasteCode),
    status: profile.status,
    ...options,
  });
}

/**
 * Record human review of AI decision
 */
export async function recordHumanReview(auditId, reviewData) {
  const { reviewedBy, approved, notes } = reviewData;

  const db = getDb();

  try {
    await db('audit_trail')
      .where({ id: auditId })
      .update({
        human_review_completed: true,
        reviewed_at: db.fn.now(),
        reviewed_by: reviewedBy,
        status: approved ? 'approved' : 'rejected',
        compliance_notes: notes,
      });

    logger.info(
      {
        auditId,
        reviewedBy,
        approved,
      },
      'Human review recorded'
    );

    return true;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        auditId,
      },
      'Failed to record human review'
    );
    throw error;
  }
}

/**
 * Query audit trail with filters
 */
export async function queryAuditTrail(filters = {}) {
  const {
    eventType,
    resourceType,
    userId,
    wasteCode,
    startDate,
    endDate,
    requiresReview,
    status,
    limit = 100,
    offset = 0,
  } = filters;

  const db = getDb();
  let query = db('audit_trail').select('*').orderBy('timestamp', 'desc');

  if (eventType) {
    query = query.where('event_type', eventType);
  }

  if (resourceType) {
    query = query.where('resource_type', resourceType);
  }

  if (userId) {
    query = query.where('user_id', userId);
  }

  if (wasteCode) {
    query = query.where('waste_code', wasteCode);
  }

  if (startDate) {
    query = query.where('timestamp', '>=', startDate);
  }

  if (endDate) {
    query = query.where('timestamp', '<=', endDate);
  }

  if (requiresReview !== undefined) {
    query = query.where('requires_human_review', requiresReview);
  }

  if (status) {
    query = query.where('status', status);
  }

  query = query.limit(limit).offset(offset);

  try {
    const results = await query;

    logger.info(
      {
        filters,
        resultCount: results.length,
      },
      'Audit trail queried'
    );

    return results;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        filters,
      },
      'Failed to query audit trail'
    );
    throw error;
  }
}

/**
 * Get audit trail for specific resource
 */
export async function getResourceAuditTrail(resourceType, resourceId) {
  const db = getDb();

  try {
    const results = await db('audit_trail')
      .where({
        resource_type: resourceType,
        resource_id: resourceId,
      })
      .orderBy('timestamp', 'asc');

    return results;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        resourceType,
        resourceId,
      },
      'Failed to get resource audit trail'
    );
    throw error;
  }
}

/**
 * Get items pending human review
 */
export async function getPendingReviews(options = {}) {
  const { limit = 50, offset = 0 } = options;

  const db = getDb();

  try {
    const results = await db('audit_trail')
      .where({
        requires_human_review: true,
        human_review_completed: false,
      })
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    logger.info(
      {
        count: results.length,
      },
      'Retrieved pending reviews'
    );

    return results;
  } catch (error) {
    logger.error(
      {
        error: error.message,
      },
      'Failed to get pending reviews'
    );
    throw error;
  }
}

/**
 * Generate audit report for date range
 */
export async function generateAuditReport(startDate, endDate) {
  const db = getDb();

  try {
    // Get summary statistics
    const stats = await db('audit_trail')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .select([
        db.raw('COUNT(*) as total_events'),
        db.raw('COUNT(DISTINCT user_id) as unique_users'),
        db.raw('COUNT(*) FILTER (WHERE requires_human_review = true) as items_requiring_review'),
        db.raw('COUNT(*) FILTER (WHERE human_review_completed = true) as items_reviewed'),
        db.raw('COUNT(*) FILTER (WHERE status = ?) as approved_items', ['approved']),
        db.raw('COUNT(*) FILTER (WHERE status = ?) as rejected_items', ['rejected']),
        db.raw('AVG(confidence_score) as avg_confidence'),
      ])
      .first();

    // Get event type breakdown
    const eventBreakdown = await db('audit_trail')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .select('event_type')
      .count('* as count')
      .groupBy('event_type')
      .orderBy('count', 'desc');

    // Get waste code distribution
    const wasteCodeBreakdown = await db('audit_trail')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .whereNotNull('waste_code')
      .select('waste_code')
      .count('* as count')
      .groupBy('waste_code')
      .orderBy('count', 'desc')
      .limit(10);

    // Get user activity
    const userActivity = await db('audit_trail')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .whereNotNull('user_id')
      .select('user_id', 'user_email')
      .count('* as event_count')
      .groupBy('user_id', 'user_email')
      .orderBy('event_count', 'desc')
      .limit(10);

    const report = {
      reportPeriod: {
        startDate,
        endDate,
      },
      summary: stats,
      eventBreakdown,
      wasteCodeBreakdown,
      userActivity,
      generatedAt: new Date().toISOString(),
    };

    logger.info(
      {
        startDate,
        endDate,
        totalEvents: stats.total_events,
      },
      'Audit report generated'
    );

    return report;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        startDate,
        endDate,
      },
      'Failed to generate audit report'
    );
    throw error;
  }
}

/**
 * Get RCRA regulation reference for waste code
 */
function getRCRAReference(wasteCode) {
  if (!wasteCode) {
    return null;
  }

  if (wasteCode.startsWith('D00')) {
    return '40 CFR 261.24 (Toxicity Characteristic)';
  }

  if (wasteCode.startsWith('D001')) {
    return '40 CFR 261.21 (Ignitability)';
  }

  if (wasteCode.startsWith('D002')) {
    return '40 CFR 261.22 (Corrosivity)';
  }

  if (wasteCode.startsWith('D003')) {
    return '40 CFR 261.23 (Reactivity)';
  }

  if (wasteCode.startsWith('F')) {
    return '40 CFR 261.31 (Hazardous Wastes from Non-Specific Sources)';
  }

  if (wasteCode.startsWith('K')) {
    return '40 CFR 261.32 (Hazardous Wastes from Specific Sources)';
  }

  if (wasteCode.startsWith('P') || wasteCode.startsWith('U')) {
    return '40 CFR 261.33 (Discarded Commercial Chemical Products)';
  }

  return '40 CFR 261 (Identification and Listing of Hazardous Waste)';
}
