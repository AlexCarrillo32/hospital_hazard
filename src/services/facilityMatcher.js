import { createLogger } from '../utils/logger.js';

const logger = createLogger('facility-matcher');

const MOCK_FACILITIES = [
  {
    id: 'fac-001',
    name: 'SafeWaste Disposal LLC',
    epaId: 'TXD987654321',
    address: '1234 Industrial Pkwy, Houston, TX 77002',
    acceptedWasteCodes: ['D001', 'D002', 'D003', 'F001', 'F002', 'F003'],
    capabilities: ['incineration', 'chemical-treatment', 'stabilization'],
    pricePerKg: 2.5,
    maxCapacityKg: 50000,
    certificationExpiry: '2026-12-31',
    location: { lat: 29.7604, lng: -95.3698 },
    rating: 4.7,
  },
  {
    id: 'fac-002',
    name: 'HazardPro Environmental Services',
    epaId: 'TXD123456789',
    address: '5678 Waste Management Dr, Dallas, TX 75201',
    acceptedWasteCodes: [
      'D001',
      'D004',
      'D005',
      'D006',
      'D007',
      'D008',
      'D009',
    ],
    capabilities: ['metal-recovery', 'stabilization', 'landfill'],
    pricePerKg: 3.0,
    maxCapacityKg: 100000,
    certificationExpiry: '2027-06-30',
    location: { lat: 32.7767, lng: -96.797 },
    rating: 4.5,
  },
  {
    id: 'fac-003',
    name: 'GreenCycle Waste Solutions',
    epaId: 'TXD555666777',
    address: '9012 Environmental Way, Austin, TX 78701',
    acceptedWasteCodes: ['D001', 'D002', 'F001', 'F003', 'U001'],
    capabilities: ['recycling', 'chemical-treatment', 'distillation'],
    pricePerKg: 2.0,
    maxCapacityKg: 25000,
    certificationExpiry: '2025-12-31',
    location: { lat: 30.2672, lng: -97.7431 },
    rating: 4.9,
  },
  {
    id: 'fac-004',
    name: 'ToxicGuard Treatment Center',
    epaId: 'TXD888999000',
    address: '3456 Safety Blvd, San Antonio, TX 78201',
    acceptedWasteCodes: [
      'D003',
      'D004',
      'D005',
      'D006',
      'D007',
      'D008',
      'D009',
    ],
    capabilities: ['stabilization', 'encapsulation', 'secure-landfill'],
    pricePerKg: 3.5,
    maxCapacityKg: 75000,
    certificationExpiry: '2028-03-31',
    location: { lat: 29.4241, lng: -98.4936 },
    rating: 4.3,
  },
];

export async function findApprovedFacilities(wasteProfile, options = {}) {
  const {
    traceId = `facility-${Date.now()}`,
    maxResults = 10,
    sortBy = 'price',
  } = options;

  logger.info(
    { traceId, wasteCode: wasteProfile.wasteCode },
    'Finding approved disposal facilities'
  );

  const wasteCode =
    wasteProfile.wasteCode || wasteProfile.classification?.wasteCode;

  if (!wasteCode || wasteCode === 'UNKNOWN') {
    throw new Error('Cannot find facilities without valid waste code');
  }

  let facilities = MOCK_FACILITIES.filter((facility) => {
    const acceptsWasteCode = facility.acceptedWasteCodes.includes(wasteCode);
    const isCertified = new Date(facility.certificationExpiry) > new Date();
    const hasCapacity =
      !wasteProfile.quantityKg ||
      facility.maxCapacityKg >= wasteProfile.quantityKg;

    return acceptsWasteCode && isCertified && hasCapacity;
  });

  facilities = facilities.map((facility) => {
    const distance = calculateDistance(
      wasteProfile.generatorLocation,
      facility.location
    );
    const estimatedCost =
      facility.pricePerKg * (wasteProfile.quantityKg || 100);
    const transportCost = calculateTransportCost(
      distance,
      wasteProfile.quantityKg || 100
    );

    return {
      ...facility,
      distance,
      estimatedDisposalCost: estimatedCost,
      estimatedTransportCost: transportCost,
      totalEstimatedCost: estimatedCost + transportCost,
    };
  });

  if (sortBy === 'price') {
    facilities.sort((a, b) => a.totalEstimatedCost - b.totalEstimatedCost);
  } else if (sortBy === 'distance') {
    facilities.sort((a, b) => a.distance - b.distance);
  } else if (sortBy === 'rating') {
    facilities.sort((a, b) => b.rating - a.rating);
  }

  const results = facilities.slice(0, maxResults);

  logger.info(
    { traceId, wasteCode, facilitiesFound: results.length },
    'Facility search completed'
  );

  return {
    wasteCode,
    facilities: results,
    totalFound: facilities.length,
    timestamp: new Date().toISOString(),
    traceId,
  };
}

export async function calculateOptimalRoute(
  wasteProfile,
  facilities,
  options = {}
) {
  const { traceId = `route-${Date.now()}`, prioritizeCost = true } = options;

  logger.info({ traceId }, 'Calculating optimal disposal route');

  if (!facilities || facilities.length === 0) {
    throw new Error('No facilities available for route optimization');
  }

  const scoredFacilities = facilities.map((facility) => {
    const costScore = prioritizeCost ? 0.7 : 0.3;
    const distanceScore = prioritizeCost ? 0.2 : 0.5;
    const ratingScore = 0.1;

    const normalizedCost =
      1 -
      facility.totalEstimatedCost /
        Math.max(...facilities.map((f) => f.totalEstimatedCost));
    const normalizedDistance =
      1 - facility.distance / Math.max(...facilities.map((f) => f.distance));
    const normalizedRating = facility.rating / 5.0;

    const score =
      normalizedCost * costScore +
      normalizedDistance * distanceScore +
      normalizedRating * ratingScore;

    return { ...facility, score };
  });

  scoredFacilities.sort((a, b) => b.score - a.score);

  const optimalFacility = scoredFacilities[0];

  const route = {
    facility: optimalFacility,
    alternativeFacilities: scoredFacilities.slice(1, 3),
    route: {
      type: 'direct-transport',
      distance: optimalFacility.distance,
      estimatedDuration: calculateDuration(optimalFacility.distance),
      method: optimalFacility.distance < 100 ? 'truck' : 'freight',
    },
    cost: {
      disposal: optimalFacility.estimatedDisposalCost,
      transport: optimalFacility.estimatedTransportCost,
      total: optimalFacility.totalEstimatedCost,
    },
    score: optimalFacility.score,
    traceId,
    timestamp: new Date().toISOString(),
  };

  logger.info(
    {
      traceId,
      facilityId: optimalFacility.id,
      totalCost: route.cost.total,
      score: route.score,
    },
    'Optimal route calculated'
  );

  return route;
}

function calculateDistance(location1, location2) {
  if (!location1 || !location2) {
    return 150;
  }

  const R = 6371;
  const dLat = toRad(location2.lat - location1.lat);
  const dLng = toRad(location2.lng - location1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(location1.lat)) *
      Math.cos(toRad(location2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateTransportCost(distanceKm, quantityKg) {
  const baseCost = 100;
  const costPerKm = 2.5;
  const costPerKg = 0.05;

  return baseCost + distanceKm * costPerKm + quantityKg * costPerKg;
}

function calculateDuration(distanceKm) {
  const avgSpeedKmh = 60;
  const hours = distanceKm / avgSpeedKmh;
  return `${Math.round(hours * 10) / 10} hours`;
}

export function getAllFacilities() {
  return MOCK_FACILITIES;
}

export function getFacilityById(facilityId) {
  return MOCK_FACILITIES.find((f) => f.id === facilityId) || null;
}
