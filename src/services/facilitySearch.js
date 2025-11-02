import { createLogger } from '../utils/logger.js';
import { getKnex as getDb } from '../db/connection.js';

const logger = createLogger('facility-search');

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km) {
  return km * 0.621371;
}

/**
 * Search facilities by geographic location and distance
 */
export async function searchFacilitiesByLocation(options = {}) {
  const {
    latitude,
    longitude,
    maxDistanceKm = 500,
    wasteCode,
    minCapacity,
    minRating,
    state,
    limit = 20,
  } = options;

  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required for location search');
  }

  const db = getDb();

  try {
    // Build query with filters
    let query = db('facilities').select('*').where('active', true);

    // Filter by waste code
    if (wasteCode) {
      query = query.whereRaw('accepted_waste_codes @> ?', [JSON.stringify([wasteCode])]);
    }

    // Filter by state if provided
    if (state) {
      query = query.where('state', state);
    }

    // Filter by minimum capacity
    if (minCapacity) {
      query = query.whereRaw('(max_capacity_kg - current_capacity_kg) >= ?', [minCapacity]);
    }

    // Filter by minimum rating
    if (minRating) {
      query = query.where('rating', '>=', minRating);
    }

    const facilities = await query;

    // Calculate distances and filter by max distance
    const facilitiesWithDistance = facilities
      .map((facility) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(facility.latitude),
          parseFloat(facility.longitude)
        );

        return {
          ...facility,
          distance_km: Math.round(distance * 10) / 10,
          distance_miles: Math.round(kmToMiles(distance) * 10) / 10,
          available_capacity_kg: facility.max_capacity_kg - facility.current_capacity_kg,
        };
      })
      .filter((facility) => facility.distance_km <= maxDistanceKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);

    logger.info(
      {
        latitude,
        longitude,
        wasteCode,
        resultsCount: facilitiesWithDistance.length,
      },
      'Facility location search completed'
    );

    return facilitiesWithDistance;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        latitude,
        longitude,
      },
      'Failed to search facilities by location'
    );
    throw error;
  }
}

/**
 * Find optimal facility based on multiple criteria
 */
export async function findOptimalFacility(options = {}) {
  const {
    latitude,
    longitude,
    wasteCode,
    quantity_kg,
    priority = 'balanced', // 'cost', 'distance', 'rating', 'balanced'
  } = options;

  const facilities = await searchFacilitiesByLocation({
    latitude,
    longitude,
    wasteCode,
    minCapacity: quantity_kg,
    maxDistanceKm: 1000,
    limit: 50,
  });

  if (facilities.length === 0) {
    return null;
  }

  // Score facilities based on priority
  const scoredFacilities = facilities.map((facility) => {
    let score = 0;

    // Normalize values to 0-1 range for scoring
    const maxDistance = Math.max(...facilities.map((f) => f.distance_km));
    const maxPrice = Math.max(...facilities.map((f) => f.price_per_kg));
    const minDistance = Math.min(...facilities.map((f) => f.distance_km));
    const minPrice = Math.min(...facilities.map((f) => f.price_per_kg));

    const distanceScore =
      1 - (facility.distance_km - minDistance) / (maxDistance - minDistance || 1);
    const priceScore = 1 - (facility.price_per_kg - minPrice) / (maxPrice - minPrice || 1);
    const ratingScore = facility.rating / 5.0;
    const capacityScore = facility.available_capacity_kg >= quantity_kg * 2 ? 1.0 : 0.7;

    switch (priority) {
      case 'cost':
        score = priceScore * 0.6 + distanceScore * 0.2 + ratingScore * 0.1 + capacityScore * 0.1;
        break;
      case 'distance':
        score = distanceScore * 0.6 + priceScore * 0.2 + ratingScore * 0.1 + capacityScore * 0.1;
        break;
      case 'rating':
        score = ratingScore * 0.6 + distanceScore * 0.2 + priceScore * 0.1 + capacityScore * 0.1;
        break;
      case 'balanced':
      default:
        score = distanceScore * 0.3 + priceScore * 0.3 + ratingScore * 0.2 + capacityScore * 0.2;
        break;
    }

    return {
      ...facility,
      optimization_score: Math.round(score * 100) / 100,
      estimated_cost: Math.round(facility.price_per_kg * quantity_kg * 100) / 100,
    };
  });

  // Sort by score descending
  scoredFacilities.sort((a, b) => b.optimization_score - a.optimization_score);

  logger.info(
    {
      wasteCode,
      quantity_kg,
      priority,
      topFacility: scoredFacilities[0]?.id,
      score: scoredFacilities[0]?.optimization_score,
    },
    'Found optimal facility'
  );

  return scoredFacilities[0];
}

/**
 * Get facilities that can handle specific waste code
 */
export async function getFacilitiesByWasteCode(wasteCode, options = {}) {
  const { limit = 50, offset = 0, minRating, state } = options;

  const db = getDb();

  try {
    let query = db('facilities')
      .select('*')
      .where('active', true)
      .whereRaw('accepted_waste_codes @> ?', [JSON.stringify([wasteCode])])
      .orderBy('rating', 'desc')
      .limit(limit)
      .offset(offset);

    if (minRating) {
      query = query.where('rating', '>=', minRating);
    }

    if (state) {
      query = query.where('state', state);
    }

    const facilities = await query;

    facilities.forEach((facility) => {
      facility.available_capacity_kg = facility.max_capacity_kg - facility.current_capacity_kg;
    });

    logger.info(
      {
        wasteCode,
        resultsCount: facilities.length,
      },
      'Retrieved facilities by waste code'
    );

    return facilities;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        wasteCode,
      },
      'Failed to get facilities by waste code'
    );
    throw error;
  }
}

/**
 * Get facility by ID with additional computed fields
 */
export async function getFacilityById(facilityId) {
  const db = getDb();

  try {
    const facility = await db('facilities').where('id', facilityId).first();

    if (!facility) {
      return null;
    }

    facility.available_capacity_kg = facility.max_capacity_kg - facility.current_capacity_kg;

    return facility;
  } catch (error) {
    logger.error(
      {
        error: error.message,
        facilityId,
      },
      'Failed to get facility by ID'
    );
    throw error;
  }
}

/**
 * Check if facility can handle waste request
 */
export function canFacilityHandleWaste(facility, wasteCode, quantity_kg) {
  const acceptsWasteCode = facility.accepted_waste_codes.includes(wasteCode);
  const hasCapacity = facility.max_capacity_kg - facility.current_capacity_kg >= quantity_kg;
  const isActive = facility.active;

  return {
    canHandle: acceptsWasteCode && hasCapacity && isActive,
    acceptsWasteCode,
    hasCapacity,
    isActive,
    availableCapacity: facility.max_capacity_kg - facility.current_capacity_kg,
  };
}
