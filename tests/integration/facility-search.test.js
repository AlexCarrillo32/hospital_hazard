/**
 * Integration tests for facility search and geographic functionality
 */

import {
  calculateDistance,
  kmToMiles,
  canFacilityHandleWaste,
} from '../../src/services/facilitySearch.js';
import { TSDF_FACILITIES } from '../../src/data/facilityData.js';

describe('Facility Search Integration', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between New York and Los Angeles', () => {
      const nyLat = 40.7128;
      const nyLon = -74.006;
      const laLat = 34.0522;
      const laLon = -118.2437;

      const distance = calculateDistance(nyLat, nyLon, laLat, laLon);

      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates correctly', () => {
      const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);

      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });
  });

  describe('kmToMiles', () => {
    it('should convert kilometers to miles correctly', () => {
      expect(kmToMiles(100)).toBeCloseTo(62.1371, 2);
      expect(kmToMiles(1)).toBeCloseTo(0.621371, 4);
      expect(kmToMiles(0)).toBe(0);
    });
  });

  describe('canFacilityHandleWaste', () => {
    const testFacility = {
      id: 'TEST-001',
      accepted_waste_codes: ['D001', 'D002', 'D003'],
      max_capacity_kg: 5000000,
      current_capacity_kg: 2000000,
      active: true,
    };

    it('should return true when facility can handle waste', () => {
      const result = canFacilityHandleWaste(testFacility, 'D001', 100000);

      expect(result.canHandle).toBe(true);
      expect(result.acceptsWasteCode).toBe(true);
      expect(result.hasCapacity).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.availableCapacity).toBe(3000000);
    });

    it('should return false when waste code not accepted', () => {
      const result = canFacilityHandleWaste(testFacility, 'F005', 100000);

      expect(result.canHandle).toBe(false);
      expect(result.acceptsWasteCode).toBe(false);
    });

    it('should return false when capacity insufficient', () => {
      const result = canFacilityHandleWaste(testFacility, 'D001', 5000000);

      expect(result.canHandle).toBe(false);
      expect(result.hasCapacity).toBe(false);
    });

    it('should return false when facility inactive', () => {
      const inactiveFacility = { ...testFacility, active: false };
      const result = canFacilityHandleWaste(inactiveFacility, 'D001', 100000);

      expect(result.canHandle).toBe(false);
      expect(result.isActive).toBe(false);
    });
  });

  describe('TSDF_FACILITIES data validation', () => {
    it('should have at least 10 facilities', () => {
      expect(TSDF_FACILITIES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have facilities in multiple states', () => {
      const states = new Set(TSDF_FACILITIES.map((f) => f.state));
      expect(states.size).toBeGreaterThan(5);
    });

    it('should have valid coordinates for all facilities', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.latitude).toBeGreaterThan(-90);
        expect(facility.latitude).toBeLessThan(90);
        expect(facility.longitude).toBeGreaterThan(-180);
        expect(facility.longitude).toBeLessThan(180);
      });
    });

    it('should have valid EPA IDs', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.epa_id).toMatch(/^[A-Z]{2}D\d{9}$/);
      });
    });

    it('should have accepted waste codes', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(Array.isArray(facility.accepted_waste_codes)).toBe(true);
        expect(facility.accepted_waste_codes.length).toBeGreaterThan(0);
      });
    });

    it('should have reasonable pricing', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.price_per_kg).toBeGreaterThan(0);
        expect(facility.price_per_kg).toBeLessThan(10);
      });
    });

    it('should have capacity information', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.max_capacity_kg).toBeGreaterThan(0);
        expect(facility.current_capacity_kg).toBeGreaterThanOrEqual(0);
        expect(facility.current_capacity_kg).toBeLessThanOrEqual(facility.max_capacity_kg);
      });
    });

    it('should have ratings between 0 and 5', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.rating).toBeGreaterThanOrEqual(0);
        expect(facility.rating).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Geographic distribution', () => {
    it('should have facilities on both coasts', () => {
      const westCoast = TSDF_FACILITIES.filter(
        (f) => f.state === 'CA' || f.state === 'WA' || f.state === 'OR'
      );
      const eastCoast = TSDF_FACILITIES.filter(
        (f) => f.state === 'NY' || f.state === 'MA' || f.state === 'NJ' || f.state === 'FL'
      );

      expect(westCoast.length).toBeGreaterThan(0);
      expect(eastCoast.length).toBeGreaterThan(0);
    });

    it('should have facilities covering major waste-producing states', () => {
      const majorStates = ['CA', 'TX', 'FL', 'IL'];
      const coveredStates = TSDF_FACILITIES.map((f) => f.state);

      majorStates.forEach((state) => {
        expect(coveredStates).toContain(state);
      });
    });
  });

  describe('Waste code coverage', () => {
    it('should have facilities accepting D001 (ignitable)', () => {
      const d001Facilities = TSDF_FACILITIES.filter((f) => f.accepted_waste_codes.includes('D001'));
      expect(d001Facilities.length).toBeGreaterThan(5);
    });

    it('should have facilities accepting toxic metals', () => {
      const toxicCodes = ['D004', 'D005', 'D006', 'D007', 'D008', 'D009'];
      const toxicFacilities = TSDF_FACILITIES.filter((f) =>
        toxicCodes.some((code) => f.accepted_waste_codes.includes(code))
      );
      expect(toxicFacilities.length).toBeGreaterThan(5);
    });

    it('should have facilities accepting spent solvents', () => {
      const solventCodes = ['F001', 'F002', 'F003', 'F004', 'F005'];
      const solventFacilities = TSDF_FACILITIES.filter((f) =>
        solventCodes.some((code) => f.accepted_waste_codes.includes(code))
      );
      expect(solventFacilities.length).toBeGreaterThan(3);
    });
  });

  describe('Facility capabilities', () => {
    it('should have facilities with certifications', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(Array.isArray(facility.certifications)).toBe(true);
        expect(facility.certifications.length).toBeGreaterThan(0);
      });
    });

    it('should have RCRA certified facilities', () => {
      const rcraCertified = TSDF_FACILITIES.filter((f) =>
        f.certifications.some((cert) => cert.includes('RCRA'))
      );
      expect(rcraCertified.length).toBeGreaterThan(10);
    });

    it('should have ISO 14001 certified facilities', () => {
      const isoCertified = TSDF_FACILITIES.filter((f) => f.certifications.includes('ISO 14001'));
      expect(isoCertified.length).toBeGreaterThan(8);
    });
  });

  describe('Contact information', () => {
    it('should have phone numbers for all facilities', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.phone).toBeTruthy();
        expect(facility.phone).toMatch(/\(\d{3}\) \d{3}-\d{4}/);
      });
    });

    it('should have email addresses for all facilities', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.email).toBeTruthy();
        expect(facility.email).toMatch(/^[\w.-]+@[\w.-]+\.\w+$/);
      });
    });

    it('should have complete addresses', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.address).toBeTruthy();
        expect(facility.city).toBeTruthy();
        expect(facility.state).toBeTruthy();
        expect(facility.zip_code).toBeTruthy();
      });
    });
  });

  describe('Distance calculations between real facilities', () => {
    it('should calculate distance from Los Angeles facility to San Francisco', () => {
      const laFacility = TSDF_FACILITIES.find((f) => f.id === 'TSDF-CA-001');
      const sfLat = 37.7749;
      const sfLon = -122.4194;

      const distance = calculateDistance(laFacility.latitude, laFacility.longitude, sfLat, sfLon);

      expect(distance).toBeGreaterThan(400);
      expect(distance).toBeLessThan(650);
    });

    it('should calculate distance between East and West coast facilities', () => {
      const westCoast = TSDF_FACILITIES.find((f) => f.state === 'CA');
      const eastCoast = TSDF_FACILITIES.find((f) => f.state === 'MA');

      if (westCoast && eastCoast) {
        const distance = calculateDistance(
          westCoast.latitude,
          westCoast.longitude,
          eastCoast.latitude,
          eastCoast.longitude
        );

        expect(distance).toBeGreaterThan(3000);
        expect(distance).toBeLessThan(5000);
      }
    });
  });

  describe('Pricing analysis', () => {
    it('should have reasonable price distribution', () => {
      const prices = TSDF_FACILITIES.map((f) => f.price_per_kg);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      expect(avgPrice).toBeGreaterThan(2.0);
      expect(avgPrice).toBeLessThan(3.0);
    });

    it('should have price variance across facilities', () => {
      const prices = TSDF_FACILITIES.map((f) => f.price_per_kg);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      expect(maxPrice - minPrice).toBeGreaterThan(0.5);
    });
  });

  describe('Capacity analysis', () => {
    it('should have total capacity over 50 million kg', () => {
      const totalCapacity = TSDF_FACILITIES.reduce((sum, f) => sum + f.max_capacity_kg, 0);

      expect(totalCapacity).toBeGreaterThan(50000000);
    });

    it('should have available capacity in all facilities', () => {
      TSDF_FACILITIES.forEach((facility) => {
        const available = facility.max_capacity_kg - facility.current_capacity_kg;
        expect(available).toBeGreaterThan(0);
      });
    });

    it('should have realistic capacity utilization', () => {
      TSDF_FACILITIES.forEach((facility) => {
        const utilization = (facility.current_capacity_kg / facility.max_capacity_kg) * 100;
        expect(utilization).toBeGreaterThanOrEqual(0);
        expect(utilization).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Active status', () => {
    it('should have all facilities marked as active', () => {
      TSDF_FACILITIES.forEach((facility) => {
        expect(facility.active).toBe(true);
      });
    });
  });
});
