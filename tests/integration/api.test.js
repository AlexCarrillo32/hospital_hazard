import request from 'supertest';
import app from '../../src/server.js';

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        service: 'waste-compliance-agent',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/waste-profiles/classify', () => {
    const validLabReport = `
      HAZARDOUS WASTE ANALYSIS REPORT
      Chemical Composition:
      - Acetone: 85%
      - Isopropyl Alcohol: 10%
      Flash Point: 0°F
    `;

    it('should classify waste from lab report', async () => {
      const response = await request(app).post('/api/waste-profiles/classify').send({
        labReportText: validLabReport,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          wasteCode: expect.any(String),
          category: expect.any(String),
          confidence: expect.any(Number),
          timestamp: expect.any(String),
        })
      );
    });

    it('should return 400 if lab report is missing', async () => {
      const response = await request(app).post('/api/waste-profiles/classify').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return D001 for ignitable waste', async () => {
      const response = await request(app).post('/api/waste-profiles/classify').send({
        labReportText: validLabReport,
      });

      expect(response.status).toBe(200);
      expect(response.body.wasteCode).toBe('D001');
      expect(response.body.category).toBe('ignitable');
    });

    it('should include confidence score between 0 and 1', async () => {
      const response = await request(app).post('/api/waste-profiles/classify').send({
        labReportText: validLabReport,
      });

      expect(response.status).toBe(200);
      expect(response.body.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/waste-profiles/generate', () => {
    const validClassification = {
      wasteCode: 'D001',
      category: 'ignitable',
      confidence: 0.92,
      reasoning: 'Test classification',
      chemicalsDetected: ['Acetone'],
      physicalProperties: { flashPoint: 0 },
    };

    it('should generate waste profile from classification', async () => {
      const response = await request(app).post('/api/waste-profiles/generate').send({
        classificationResult: validClassification,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          wasteCode: 'D001',
          category: 'ignitable',
          profileDocument: expect.any(String),
          status: 'pending_review',
        })
      );
    });

    it('should return 400 if classification is missing', async () => {
      const response = await request(app).post('/api/waste-profiles/generate').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/facilities/search', () => {
    const validWasteProfile = {
      wasteCode: 'D001',
      category: 'ignitable',
      quantityKg: 150,
      generatorLocation: { lat: 29.7604, lng: -95.3698 },
    };

    it('should find facilities for waste profile', async () => {
      const response = await request(app).post('/api/facilities/search').send({
        wasteProfile: validWasteProfile,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          wasteCode: 'D001',
          facilities: expect.any(Array),
          totalFound: expect.any(Number),
        })
      );
    });

    it('should return facilities with complete information', async () => {
      const response = await request(app).post('/api/facilities/search').send({
        wasteProfile: validWasteProfile,
      });

      expect(response.status).toBe(200);
      expect(response.body.facilities.length).toBeGreaterThan(0);

      response.body.facilities.forEach((facility) => {
        expect(facility).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            epaId: expect.any(String),
            state: expect.any(String),
            pricePerKg: expect.any(Number),
            totalEstimatedCost: expect.any(Number),
          })
        );
      });
    });

    it('should return 400 if waste profile is missing', async () => {
      const response = await request(app).post('/api/facilities/search').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/facilities/route', () => {
    const validWasteProfile = {
      wasteCode: 'D001',
      quantityKg: 150,
      generatorLocation: { lat: 29.7604, lng: -95.3698 },
    };

    const validFacilities = [
      {
        id: 'fac-001',
        name: 'Test Facility',
        pricePerKg: 2.5,
        distance: 150,
        totalEstimatedCost: 500,
        rating: 4.5,
        location: { lat: 30.0, lng: -96.0 },
      },
    ];

    it('should calculate optimal route', async () => {
      const response = await request(app).post('/api/facilities/route').send({
        wasteProfile: validWasteProfile,
        facilities: validFacilities,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          facility: expect.any(Object),
          route: expect.any(Object),
          cost: expect.any(Object),
        })
      );
    });

    it('should include cost breakdown', async () => {
      const response = await request(app).post('/api/facilities/route').send({
        wasteProfile: validWasteProfile,
        facilities: validFacilities,
      });

      expect(response.status).toBe(200);
      expect(response.body.cost).toEqual(
        expect.objectContaining({
          disposal: expect.any(Number),
          transport: expect.any(Number),
          total: expect.any(Number),
        })
      );
    });

    it('should return 400 if parameters are missing', async () => {
      const response = await request(app).post('/api/facilities/route').send({
        wasteProfile: validWasteProfile,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/manifests', () => {
    const validManifestData = {
      wasteProfile: {
        wasteCode: 'D001',
        category: 'ignitable',
        quantityKg: 150,
      },
      facility: {
        id: 'fac-001',
        name: 'Test Facility',
        epaId: 'TXD123456789',
        address: '123 Test St, Houston, TX',
      },
      route: {
        route: {
          distance: 150,
          method: 'truck',
        },
      },
    };

    it('should create electronic manifest', async () => {
      const response = await request(app).post('/api/manifests').send(validManifestData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          manifestNumber: expect.stringMatching(/^EPA-/),
          status: 'created',
          wasteProfile: expect.any(Object),
          generator: expect.any(Object),
          facility: expect.any(Object),
        })
      );
    });

    it('should generate unique manifest numbers', async () => {
      const response1 = await request(app).post('/api/manifests').send(validManifestData);
      const response2 = await request(app).post('/api/manifests').send(validManifestData);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.manifestNumber).not.toBe(response2.body.manifestNumber);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app).post('/api/manifests').send({
        wasteProfile: validManifestData.wasteProfile,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full waste disposal workflow', async () => {
      // Step 1: Classify waste
      const classifyResponse = await request(app)
        .post('/api/waste-profiles/classify')
        .send({
          labReportText: `
          HAZARDOUS WASTE ANALYSIS
          Chemical: Acetone 90%
          Flash Point: -4°F
        `,
        });

      expect(classifyResponse.status).toBe(200);
      const classification = classifyResponse.body;

      // Step 2: Generate profile
      const profileResponse = await request(app).post('/api/waste-profiles/generate').send({
        classificationResult: classification,
      });

      expect(profileResponse.status).toBe(200);
      const profile = profileResponse.body;

      // Step 3: Find facilities
      const facilitiesResponse = await request(app)
        .post('/api/facilities/search')
        .send({
          wasteProfile: {
            ...profile,
            quantityKg: 100,
            generatorLocation: { lat: 29.7604, lng: -95.3698 },
          },
        });

      expect(facilitiesResponse.status).toBe(200);
      expect(facilitiesResponse.body.facilities.length).toBeGreaterThan(0);

      // Step 4: Calculate route
      const routeResponse = await request(app)
        .post('/api/facilities/route')
        .send({
          wasteProfile: {
            wasteCode: profile.wasteCode,
            quantityKg: 100,
            generatorLocation: { lat: 29.7604, lng: -95.3698 },
          },
          facilities: facilitiesResponse.body.facilities,
        });

      expect(routeResponse.status).toBe(200);

      // Step 5: Create manifest
      const manifestResponse = await request(app)
        .post('/api/manifests')
        .send({
          wasteProfile: { ...profile, quantityKg: 100 },
          facility: routeResponse.body.facility,
          route: routeResponse.body,
        });

      expect(manifestResponse.status).toBe(201);
      expect(manifestResponse.body.status).toBe('created');
    });
  });
});
