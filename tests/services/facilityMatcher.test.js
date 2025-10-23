import {
  findApprovedFacilities,
  calculateOptimalRoute,
  getFacilitiesByState,
  getAvailableStates,
} from '../../src/services/facilityMatcher.js';

describe('facilityMatcher', () => {
  describe('findApprovedFacilities', () => {
    const mockWasteProfile = {
      wasteCode: 'D001',
      category: 'ignitable',
      quantityKg: 150,
      generatorLocation: {
        lat: 29.7604,
        lng: -95.3698,
      },
    };

    it('should find facilities that accept the waste code', async () => {
      const result = await findApprovedFacilities(mockWasteProfile);

      expect(result).toEqual(
        expect.objectContaining({
          wasteCode: 'D001',
          facilities: expect.any(Array),
          totalFound: expect.any(Number),
        })
      );

      expect(result.facilities.length).toBeGreaterThan(0);
    });

    it('should return facilities with required properties', async () => {
      const result = await findApprovedFacilities(mockWasteProfile);

      result.facilities.forEach((facility) => {
        expect(facility).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            state: expect.any(String),
            epaId: expect.any(String),
            acceptedWasteCodes: expect.arrayContaining(['D001']),
            pricePerKg: expect.any(Number),
            distance: expect.any(Number),
            totalEstimatedCost: expect.any(Number),
          })
        );
      });
    });

    it('should filter by state when states option is provided', async () => {
      const result = await findApprovedFacilities(mockWasteProfile, {
        states: ['TX', 'CA'],
      });

      result.facilities.forEach((facility) => {
        expect(['TX', 'CA']).toContain(facility.state);
      });
    });

    it('should sort by price when sortBy is price', async () => {
      const result = await findApprovedFacilities(mockWasteProfile, {
        sortBy: 'price',
      });

      for (let i = 0; i < result.facilities.length - 1; i++) {
        expect(result.facilities[i].totalEstimatedCost).toBeLessThanOrEqual(
          result.facilities[i + 1].totalEstimatedCost
        );
      }
    });

    it('should sort by distance when sortBy is distance', async () => {
      const result = await findApprovedFacilities(mockWasteProfile, {
        sortBy: 'distance',
      });

      for (let i = 0; i < result.facilities.length - 1; i++) {
        expect(result.facilities[i].distance).toBeLessThanOrEqual(
          result.facilities[i + 1].distance
        );
      }
    });

    it('should include distance in facility results', async () => {
      const result = await findApprovedFacilities(mockWasteProfile);

      result.facilities.forEach((facility) => {
        expect(facility.distance).toBeGreaterThanOrEqual(0);
        expect(typeof facility.distance).toBe('number');
      });
    });
  });

  describe('calculateOptimalRoute', () => {
    const mockWasteProfile = {
      wasteCode: 'D001',
      category: 'ignitable',
      quantityKg: 150,
      generatorLocation: {
        lat: 29.7604,
        lng: -95.3698,
      },
    };

    let mockFacilities;

    beforeAll(async () => {
      const result = await findApprovedFacilities(mockWasteProfile);
      mockFacilities = result.facilities;
    });

    it('should return optimal facility and route', async () => {
      const result = await calculateOptimalRoute(mockWasteProfile, mockFacilities);

      expect(result).toEqual(
        expect.objectContaining({
          facility: expect.any(Object),
          alternativeFacilities: expect.any(Array),
          route: expect.any(Object),
          cost: expect.any(Object),
        })
      );
    });

    it('should select facility with highest optimization score', async () => {
      const result = await calculateOptimalRoute(mockWasteProfile, mockFacilities);

      expect(result.facility.score).toBeDefined();
      expect(result.alternativeFacilities.every((alt) => alt.score <= result.facility.score)).toBe(
        true
      );
    });

    it('should include cost breakdown', async () => {
      const result = await calculateOptimalRoute(mockWasteProfile, mockFacilities);

      expect(result.cost).toEqual(
        expect.objectContaining({
          disposal: expect.any(Number),
          transport: expect.any(Number),
          total: expect.any(Number),
        })
      );

      expect(result.cost.total).toBe(result.cost.disposal + result.cost.transport);
    });

    it('should include route details', async () => {
      const result = await calculateOptimalRoute(mockWasteProfile, mockFacilities);

      expect(result.route).toEqual(
        expect.objectContaining({
          type: expect.any(String),
          distance: expect.any(Number),
          method: expect.any(String),
        })
      );
    });

    it('should prioritize cost when prioritizeCost option is true', async () => {
      const result = await calculateOptimalRoute(mockWasteProfile, mockFacilities, {
        prioritizeCost: true,
      });

      expect(result.facility).toBeDefined();
      expect(result.facility.totalEstimatedCost).toBeDefined();
    });
  });

  describe('getFacilitiesByState', () => {
    it('should return facilities for valid state', () => {
      const txFacilities = getFacilitiesByState('TX');

      expect(txFacilities.length).toBeGreaterThan(0);
      txFacilities.forEach((facility) => {
        expect(facility.state).toBe('TX');
      });
    });

    it('should return empty array for invalid state', () => {
      const facilities = getFacilitiesByState('ZZ');

      expect(facilities).toEqual([]);
    });
  });

  describe('getAvailableStates', () => {
    it('should return array of state codes', () => {
      const states = getAvailableStates();

      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });

    it('should return sorted state codes', () => {
      const states = getAvailableStates();

      const sortedStates = [...states].sort();
      expect(states).toEqual(sortedStates);
    });

    it('should include TX and CA states', () => {
      const states = getAvailableStates();

      expect(states).toContain('TX');
      expect(states).toContain('CA');
    });
  });
});
