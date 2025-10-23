import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('manifest-generator');

const manifests = new Map();

export async function createManifest(wasteProfile, facility, route, options = {}) {
  const { traceId = `manifest-${Date.now()}`, generatorInfo = {} } = options;

  logger.info({ traceId, facilityId: facility.id }, 'Creating electronic manifest');

  const manifestNumber = `EPA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const manifestId = uuidv4();

  const manifest = {
    id: manifestId,
    manifestNumber,
    status: 'created',
    wasteProfile: {
      wasteCode: wasteProfile.wasteCode,
      category: wasteProfile.category,
      quantity: wasteProfile.quantityKg || 100,
      unit: 'kg',
      physicalState: wasteProfile.physicalState || 'solid',
    },
    generator: {
      name: generatorInfo.name || 'Unknown Generator',
      epaId: generatorInfo.epaId || 'TXD000000000',
      address: generatorInfo.address || 'Unknown Address',
      contactName: generatorInfo.contactName,
      contactPhone: generatorInfo.contactPhone,
      contactEmail: generatorInfo.contactEmail,
    },
    facility: {
      id: facility.id,
      name: facility.name,
      epaId: facility.epaId,
      address: facility.address,
    },
    transporter: {
      name: route.route.method === 'truck' ? 'SafeHaul Logistics' : 'FreightMaster Inc',
      epaId: route.route.method === 'truck' ? 'TXR111222333' : 'TXR444555666',
      vehicleType: route.route.method,
    },
    route: {
      distance: route.route.distance,
      estimatedDuration: route.route.estimatedDuration,
      method: route.route.method,
    },
    cost: route.cost,
    signatures: {
      generator: null,
      transporter: null,
      facility: null,
    },
    dates: {
      created: new Date().toISOString(),
      shippingScheduled: null,
      shipped: null,
      received: null,
    },
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        action: 'manifest_created',
        actor: 'system',
        details: { traceId, manifestNumber },
      },
    ],
    traceId,
  };

  manifests.set(manifestId, manifest);

  logger.info(
    {
      traceId,
      manifestId,
      manifestNumber,
    },
    'Electronic manifest created'
  );

  return manifest;
}

export async function trackManifest(manifestId, options = {}) {
  const { traceId = `track-${Date.now()}` } = options;

  logger.info({ traceId, manifestId }, `Tracking manifest ${manifestId}`);

  const manifest = manifests.get(manifestId);

  if (!manifest) {
    throw new Error(`Manifest not found: ${manifestId}`);
  }

  const tracking = {
    manifestId,
    manifestNumber: manifest.manifestNumber,
    status: manifest.status,
    currentLocation: getCurrentLocation(manifest),
    timeline: buildTimeline(manifest),
    signatures: manifest.signatures,
    estimatedDelivery: manifest.dates.shippingScheduled
      ? calculateEstimatedDelivery(manifest)
      : null,
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
}

export async function updateManifestStatus(manifestId, newStatus, actor, details = {}) {
  const traceId = `update-${Date.now()}`;

  logger.info({ traceId, manifestId, newStatus }, 'Updating manifest status');

  const manifest = manifests.get(manifestId);

  if (!manifest) {
    throw new Error(`Manifest not found: ${manifestId}`);
  }

  const previousStatus = manifest.status;
  manifest.status = newStatus;

  const auditEntry = {
    timestamp: new Date().toISOString(),
    action: `status_changed_${previousStatus}_to_${newStatus}`,
    actor,
    details: { ...details, previousStatus, newStatus },
  };

  manifest.auditTrail.push(auditEntry);

  if (newStatus === 'shipped') {
    manifest.dates.shipped = new Date().toISOString();
  } else if (newStatus === 'received') {
    manifest.dates.received = new Date().toISOString();
  }

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

  return manifest;
}

export async function signManifest(manifestId, role, signatureData) {
  const traceId = `sign-${Date.now()}`;

  logger.info({ traceId, manifestId, role }, 'Signing manifest');

  const manifest = manifests.get(manifestId);

  if (!manifest) {
    throw new Error(`Manifest not found: ${manifestId}`);
  }

  if (!['generator', 'transporter', 'facility'].includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  manifest.signatures[role] = {
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

  manifest.auditTrail.push(auditEntry);

  const allSigned =
    manifest.signatures.generator &&
    manifest.signatures.transporter &&
    manifest.signatures.facility;

  if (allSigned && manifest.status !== 'completed') {
    manifest.status = 'completed';
    manifest.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'manifest_completed',
      actor: 'system',
      details: { allPartiesSigned: true },
    });
  }

  logger.info(
    {
      traceId,
      manifestId,
      role,
      allSigned,
    },
    'Manifest signed'
  );

  return manifest;
}

function getCurrentLocation(manifest) {
  const { status } = manifest;

  if (status === 'created' || status === 'pending') {
    return {
      location: 'Generator Facility',
      address: manifest.generator.address,
    };
  }
  if (status === 'shipped' || status === 'in_transit') {
    return {
      location: 'In Transit',
      address: `En route to ${manifest.facility.name}`,
    };
  }
  if (status === 'received' || status === 'completed') {
    return {
      location: 'Disposal Facility',
      address: manifest.facility.address,
    };
  }

  return {
    location: 'Unknown',
    address: 'N/A',
  };
}

function buildTimeline(manifest) {
  return manifest.auditTrail.map((entry) => ({
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

function calculateEstimatedDelivery(manifest) {
  if (!manifest.dates.shipped) {
    return null;
  }

  const shippedDate = new Date(manifest.dates.shipped);
  const durationHours = parseFloat(manifest.route.estimatedDuration);
  const estimatedDelivery = new Date(shippedDate.getTime() + durationHours * 60 * 60 * 1000);

  return estimatedDelivery.toISOString();
}

export function getAllManifests() {
  return Array.from(manifests.values());
}

export function getManifestById(manifestId) {
  return manifests.get(manifestId) || null;
}
