import { createLogger } from '../utils/logger.js';
import { getKnex as getDb } from '../db/connection.js';
import { recordAudit } from './auditService.js';
import { randomUUID } from 'crypto';

const logger = createLogger('manifest-generator');

const VALID_STATUSES = ['draft', 'submitted', 'in_transit', 'delivered', 'completed', 'cancelled'];
const STATUS_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  submitted: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

export async function createManifest(wasteProfile, facility, route, options = {}) {
  const { traceId = `manifest-${Date.now()}`, generatorInfo = {} } = options;

  logger.info({ traceId, facilityId: facility.id }, 'Creating electronic manifest');

  const manifestNumber = `EPA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  const auditTrail = [
    {
      timestamp: new Date().toISOString(),
      action: 'manifest_created',
      actor: 'system',
      details: { traceId, manifestNumber },
    },
  ];

  const signatures = {
    generator: null,
    transporter: null,
    facility: null,
  };

  const routeDetails = {
    distance: route.route?.distance || route.distance,
    estimatedDuration: route.route?.estimatedDuration || route.estimatedDuration,
    method: route.route?.method || route.method || 'truck',
    cost: route.cost,
    generator: {
      name: generatorInfo.name || 'Unknown Generator',
      epaId: generatorInfo.epaId || 'TXD000000000',
      address: generatorInfo.address || 'Unknown Address',
      contactName: generatorInfo.contactName,
      contactPhone: generatorInfo.contactPhone,
      contactEmail: generatorInfo.contactEmail,
    },
    transporter: {
      name:
        (route.route?.method || route.method) === 'truck'
          ? 'SafeHaul Logistics'
          : 'FreightMaster Inc',
      epaId: (route.route?.method || route.method) === 'truck' ? 'TXR111222333' : 'TXR444555666',
      vehicleType: route.route?.method || route.method || 'truck',
    },
    wasteDetails: {
      wasteCode: wasteProfile.wasteCode,
      category: wasteProfile.category,
      quantity: wasteProfile.quantityKg || 100,
      unit: 'kg',
      physicalState: wasteProfile.physicalState || 'solid',
    },
  };

  const db = getDb();

  const manifestId = randomUUID();

  try {
    const [result] = await db('manifests')
      .insert({
        id: manifestId,
        manifest_number: manifestNumber,
        waste_profile_id: wasteProfile.id || null,
        generator_id: generatorInfo.id || null,
        facility_id: facility.id,
        transporter_name:
          (route.route?.method || route.method) === 'truck'
            ? 'SafeHaul Logistics'
            : 'FreightMaster Inc',
        transporter_epa_id:
          (route.route?.method || route.method) === 'truck' ? 'TXR111222333' : 'TXR444555666',
        status: 'draft',
        route_details: JSON.stringify(routeDetails),
        signatures: JSON.stringify(signatures),
        audit_trail: JSON.stringify(auditTrail),
      })
      .returning('*');

    await recordAudit({
      eventType: 'manifest_creation',
      action: 'create',
      resourceType: 'manifest',
      resourceId: result.id,
      traceId,
      status: 'completed',
      metadata: {
        manifestNumber,
        facilityId: facility.id,
        wasteCode: wasteProfile.wasteCode,
      },
    });

    logger.info(
      {
        traceId,
        manifestId: result.id,
        manifestNumber,
      },
      'Electronic manifest created'
    );

    return formatManifestResponse(result);
  } catch (error) {
    logger.error(
      {
        error: error.message,
        traceId,
      },
      'Failed to create manifest'
    );
    throw error;
  }
}

export async function trackManifest(manifestId, options = {}) {
  const { traceId = `track-${Date.now()}` } = options;

  logger.info({ traceId, manifestId }, `Tracking manifest ${manifestId}`);

  const db = getDb();

  try {
    const manifest = await db('manifests').where('id', manifestId).first();

    if (!manifest) {
      throw new Error(`Manifest not found: ${manifestId}`);
    }

    const routeDetails = JSON.parse(manifest.route_details);
    const signatures = JSON.parse(manifest.signatures);
    const auditTrail = JSON.parse(manifest.audit_trail);

    const tracking = {
      manifestId: manifest.id,
      manifestNumber: manifest.manifest_number,
      status: manifest.status,
      currentLocation: getCurrentLocation(manifest.status, routeDetails),
      timeline: buildTimeline(auditTrail),
      signatures,
      estimatedDelivery: calculateEstimatedDelivery(manifest.created_at, routeDetails),
      traceId,
    };

    logger.info(
      {
        traceId,
        manifestId,
        status: tracking.status,
      },
      'Manifest tracking retrieved'
    );

    return tracking;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        traceId,
        manifestId,
      },
      'Failed to track manifest'
    );
    throw error;
  }
}

export async function updateManifestStatus(manifestId, newStatus, actor, details = {}) {
  const traceId = `update-${Date.now()}`;

  logger.info({ traceId, manifestId, newStatus }, 'Updating manifest status');

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`);
  }

  const db = getDb();

  try {
    const manifest = await db('manifests').where('id', manifestId).first();

    if (!manifest) {
      throw new Error(`Manifest not found: ${manifestId}`);
    }

    const previousStatus = manifest.status;

    if (!STATUS_TRANSITIONS[previousStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${previousStatus} to ${newStatus}. Valid transitions: ${STATUS_TRANSITIONS[previousStatus]?.join(', ') || 'none'}`
      );
    }

    const auditTrail = JSON.parse(manifest.audit_trail);
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: `status_changed_${previousStatus}_to_${newStatus}`,
      actor,
      details: { ...details, previousStatus, newStatus },
    };

    auditTrail.push(auditEntry);

    await db('manifests')
      .where('id', manifestId)
      .update({
        status: newStatus,
        audit_trail: JSON.stringify(auditTrail),
        updated_at: db.fn.now(),
      });

    await recordAudit({
      eventType: 'manifest_status_change',
      action: 'update',
      resourceType: 'manifest',
      resourceId: manifestId,
      traceId,
      status: 'completed',
      metadata: {
        previousStatus,
        newStatus,
        actor,
      },
    });

    logger.info(
      {
        traceId,
        manifestId,
        previousStatus,
        newStatus,
        actor,
      },
      'Manifest status updated'
    );

    const updatedManifest = await db('manifests').where('id', manifestId).first();
    return formatManifestResponse(updatedManifest);
  } catch (error) {
    logger.error(
      {
        error: error.message,
        traceId,
        manifestId,
      },
      'Failed to update manifest status'
    );
    throw error;
  }
}

export async function signManifest(manifestId, role, signatureData) {
  const traceId = `sign-${Date.now()}`;

  logger.info({ traceId, manifestId, role }, 'Signing manifest');

  if (!['generator', 'transporter', 'facility'].includes(role)) {
    throw new Error(`Invalid role: ${role}. Valid roles: generator, transporter, facility`);
  }

  const db = getDb();

  try {
    const manifest = await db('manifests').where('id', manifestId).first();

    if (!manifest) {
      throw new Error(`Manifest not found: ${manifestId}`);
    }

    const signatures = JSON.parse(manifest.signatures);
    const auditTrail = JSON.parse(manifest.audit_trail);

    signatures[role] = {
      signedBy: signatureData.name,
      signedAt: new Date().toISOString(),
      signature: signatureData.signature || 'digital-signature',
    };

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: `${role}_signed`,
      actor: signatureData.name,
      details: { role },
    };

    auditTrail.push(auditEntry);

    const allSigned = signatures.generator && signatures.transporter && signatures.facility;

    let newStatus = manifest.status;
    if (allSigned && manifest.status !== 'completed') {
      newStatus = 'completed';
      auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'manifest_completed',
        actor: 'system',
        details: { allPartiesSigned: true },
      });
    }

    await db('manifests')
      .where('id', manifestId)
      .update({
        signatures: JSON.stringify(signatures),
        audit_trail: JSON.stringify(auditTrail),
        status: newStatus,
        updated_at: db.fn.now(),
      });

    await recordAudit({
      eventType: 'manifest_signature',
      action: 'update',
      resourceType: 'manifest',
      resourceId: manifestId,
      traceId,
      status: 'completed',
      metadata: {
        role,
        signedBy: signatureData.name,
        allSigned,
      },
    });

    logger.info(
      {
        traceId,
        manifestId,
        role,
        allSigned,
      },
      'Manifest signed'
    );

    const updatedManifest = await db('manifests').where('id', manifestId).first();
    return formatManifestResponse(updatedManifest);
  } catch (error) {
    logger.error(
      {
        error: error.message,
        traceId,
        manifestId,
        role,
      },
      'Failed to sign manifest'
    );
    throw error;
  }
}

function getCurrentLocation(status, routeDetails) {
  if (status === 'draft' || status === 'submitted') {
    return {
      location: 'Generator Facility',
      address: routeDetails.generator?.address || 'Unknown',
    };
  }
  if (status === 'in_transit') {
    return {
      location: 'In Transit',
      address: `En route to facility`,
    };
  }
  if (status === 'delivered' || status === 'completed') {
    return {
      location: 'Disposal Facility',
      address: 'Facility',
    };
  }
  if (status === 'cancelled') {
    return {
      location: 'Cancelled',
      address: 'N/A',
    };
  }

  return {
    location: 'Unknown',
    address: 'N/A',
  };
}

function buildTimeline(auditTrail) {
  return auditTrail.map((entry) => ({
    timestamp: entry.timestamp,
    event: formatEventName(entry.action),
    actor: entry.actor,
    details: entry.details,
  }));
}

function formatEventName(action) {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function calculateEstimatedDelivery(createdAt, routeDetails) {
  if (!createdAt || !routeDetails.estimatedDuration) {
    return null;
  }

  const createdDate = new Date(createdAt);
  const durationHours = parseFloat(routeDetails.estimatedDuration);
  const estimatedDelivery = new Date(createdDate.getTime() + durationHours * 60 * 60 * 1000);

  return estimatedDelivery.toISOString();
}

function formatManifestResponse(manifest) {
  const routeDetails = JSON.parse(manifest.route_details);
  const signatures = JSON.parse(manifest.signatures);
  const auditTrail = JSON.parse(manifest.audit_trail);

  return {
    id: manifest.id,
    manifestNumber: manifest.manifest_number,
    status: manifest.status,
    wasteProfile: routeDetails.wasteDetails,
    generator: routeDetails.generator,
    facility: {
      id: manifest.facility_id,
    },
    transporter: {
      name: manifest.transporter_name,
      epaId: manifest.transporter_epa_id,
      vehicleType: routeDetails.transporter?.vehicleType,
    },
    route: {
      distance: routeDetails.distance,
      estimatedDuration: routeDetails.estimatedDuration,
      method: routeDetails.method,
    },
    cost: routeDetails.cost,
    signatures,
    dates: {
      created: manifest.created_at,
      updated: manifest.updated_at,
    },
    auditTrail,
  };
}

export async function getAllManifests(options = {}) {
  const { limit = 50, offset = 0, status } = options;

  const db = getDb();

  try {
    let query = db('manifests').select('*').orderBy('created_at', 'desc');

    if (status) {
      query = query.where('status', status);
    }

    const manifests = await query.limit(limit).offset(offset);

    return manifests.map(formatManifestResponse);
  } catch (error) {
    logger.error(
      {
        error: error.message,
      },
      'Failed to get all manifests'
    );
    throw error;
  }
}

export async function getManifestById(manifestId) {
  const db = getDb();

  try {
    const manifest = await db('manifests').where('id', manifestId).first();

    if (!manifest) {
      return null;
    }

    return formatManifestResponse(manifest);
  } catch (error) {
    logger.error(
      {
        error: error.message,
        manifestId,
      },
      'Failed to get manifest by ID'
    );
    throw error;
  }
}

export async function deleteManifest(manifestId) {
  const db = getDb();

  try {
    const manifest = await db('manifests').where('id', manifestId).first();

    if (!manifest) {
      throw new Error(`Manifest not found: ${manifestId}`);
    }

    if (manifest.status !== 'draft' && manifest.status !== 'cancelled') {
      throw new Error(
        `Cannot delete manifest with status ${manifest.status}. Only draft or cancelled manifests can be deleted.`
      );
    }

    await db('manifests').where('id', manifestId).del();

    await recordAudit({
      eventType: 'manifest_deletion',
      action: 'delete',
      resourceType: 'manifest',
      resourceId: manifestId,
      status: 'completed',
      metadata: {
        manifestNumber: manifest.manifest_number,
        previousStatus: manifest.status,
      },
    });

    logger.info(
      {
        manifestId,
        manifestNumber: manifest.manifest_number,
      },
      'Manifest deleted'
    );

    return true;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        manifestId,
      },
      'Failed to delete manifest'
    );
    throw error;
  }
}
