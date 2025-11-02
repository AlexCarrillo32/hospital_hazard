import {
  createManifest,
  signManifest,
  trackManifest,
  updateManifestStatus,
} from '../../src/services/manifestGenerator.js';

describe('manifestGenerator', () => {
  describe('createManifest', () => {
    const mockWasteProfile = {
      wasteCode: 'D001',
      category: 'ignitable',
      quantityKg: 150,
    };

    const mockFacility = {
      id: 'fac-001',
      name: 'SafeWaste Disposal LLC',
      epaId: 'TXD987654321',
      address: '1234 Industrial Pkwy, Houston, TX 77002',
    };

    const mockRoute = {
      route: {
        distance: 150,
        method: 'truck',
        estimatedDuration: 2.5,
      },
    };

    const mockGeneratorInfo = {
      name: 'Memorial Hospital',
      epaId: 'TXD111222333',
      address: '123 Medical Center Blvd, Houston, TX 77030',
      contactName: 'Dr. Sarah Johnson',
    };

    it('should create a new manifest', async () => {
      const result = await createManifest(mockWasteProfile, mockFacility, mockRoute, {
        generatorInfo: mockGeneratorInfo,
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          manifestNumber: expect.stringMatching(/^EPA-\d+-[A-Z0-9]+$/),
          status: 'draft',
          wasteProfile: expect.any(Object),
          generator: expect.any(Object),
          facility: expect.any(Object),
          transporter: expect.any(Object),
          signatures: expect.any(Object),
          dates: expect.any(Object),
          auditTrail: expect.any(Array),
        })
      );
    });

    it('should generate unique manifest number', async () => {
      const manifest1 = await createManifest(mockWasteProfile, mockFacility, mockRoute, {
        generatorInfo: mockGeneratorInfo,
      });
      const manifest2 = await createManifest(mockWasteProfile, mockFacility, mockRoute, {
        generatorInfo: mockGeneratorInfo,
      });

      expect(manifest1.manifestNumber).not.toBe(manifest2.manifestNumber);
    });

    it('should initialize all signatures as null', async () => {
      const result = await createManifest(mockWasteProfile, mockFacility, mockRoute, {
        generatorInfo: mockGeneratorInfo,
      });

      expect(result.signatures.generator).toBeNull();
      expect(result.signatures.transporter).toBeNull();
      expect(result.signatures.facility).toBeNull();
    });

    it('should include audit trail with creation event', async () => {
      const result = await createManifest(mockWasteProfile, mockFacility, mockRoute, {
        generatorInfo: mockGeneratorInfo,
      });

      expect(result.auditTrail).toHaveLength(1);
      expect(result.auditTrail[0]).toEqual(
        expect.objectContaining({
          timestamp: expect.any(String),
          action: 'manifest_created',
          actor: 'system',
        })
      );
    });
  });

  describe('signManifest', () => {
    let testManifestId;

    beforeEach(async () => {
      const manifest = await createManifest(
        { wasteCode: 'D001', category: 'ignitable', quantityKg: 150 },
        {
          id: 'fac-001',
          name: 'SafeWaste',
          epaId: 'TXD987654321',
          address: '123 Main St',
        },
        { route: { distance: 150, method: 'truck' } },
        {
          generatorInfo: {
            name: 'Hospital',
            epaId: 'TXD111222333',
            address: '123 Medical',
            contactName: 'Dr. Johnson',
          },
        }
      );
      testManifestId = manifest.id;
    });

    it('should add signature to manifest', async () => {
      const result = await signManifest(testManifestId, 'generator', {
        name: 'Dr. Sarah Johnson',
        signature: 'digital-signature-generator-001',
      });

      expect(result.signatures.generator).toEqual(
        expect.objectContaining({
          signedBy: 'Dr. Sarah Johnson',
          signedAt: expect.any(String),
          signature: 'digital-signature-generator-001',
        })
      );
    });

    it('should add audit trail entry when signing', async () => {
      const result = await signManifest(testManifestId, 'generator', {
        name: 'Dr. Sarah Johnson',
        signature: 'sig-001',
      });

      const signatureEvent = result.auditTrail.find((event) => event.action === 'generator_signed');

      expect(signatureEvent).toBeDefined();
      expect(signatureEvent.actor).toBe('Dr. Sarah Johnson');
    });

    it('should mark manifest as completed when all parties sign', async () => {
      await signManifest(testManifestId, 'generator', { name: 'Generator', signature: 'sig-1' });
      await signManifest(testManifestId, 'transporter', {
        name: 'Transporter',
        signature: 'sig-2',
      });
      const result = await signManifest(testManifestId, 'facility', {
        name: 'Facility',
        signature: 'sig-3',
      });

      expect(result.status).toBe('completed');
    });

    it('should not mark as completed if any signature is missing', async () => {
      await signManifest(testManifestId, 'generator', { name: 'Generator', signature: 'sig-1' });
      const result = await signManifest(testManifestId, 'transporter', {
        name: 'Transporter',
        signature: 'sig-2',
      });

      expect(result.status).not.toBe('completed');
    });
  });

  describe('trackManifest', () => {
    let testManifestId;

    beforeEach(async () => {
      const manifest = await createManifest(
        { wasteCode: 'D001', category: 'ignitable', quantityKg: 150 },
        {
          id: 'fac-001',
          name: 'SafeWaste',
          epaId: 'TXD987654321',
          address: '123 Main St, Houston, TX',
        },
        { route: { distance: 150, method: 'truck' } },
        {
          generatorInfo: {
            name: 'Hospital',
            epaId: 'TXD111222333',
            address: '123 Medical',
            contactName: 'Dr. Johnson',
          },
        }
      );
      testManifestId = manifest.id;
    });

    it('should return manifest tracking information', async () => {
      const result = await trackManifest(testManifestId);

      expect(result).toEqual(
        expect.objectContaining({
          manifestId: testManifestId,
          manifestNumber: expect.any(String),
          status: expect.any(String),
          currentLocation: expect.any(Object),
          timeline: expect.any(Array),
          signatures: expect.any(Object),
          traceId: expect.any(String),
        })
      );
    });

    it('should include timeline from audit trail', async () => {
      const result = await trackManifest(testManifestId);

      expect(result.timeline.length).toBeGreaterThan(0);
      result.timeline.forEach((event) => {
        expect(event).toEqual(
          expect.objectContaining({
            event: expect.any(String),
            actor: expect.any(String),
            timestamp: expect.any(String),
          })
        );
      });
    });
  });

  describe('updateManifestStatus', () => {
    let testManifestId;

    beforeEach(async () => {
      const manifest = await createManifest(
        { wasteCode: 'D001', category: 'ignitable', quantityKg: 150 },
        {
          id: 'fac-001',
          name: 'SafeWaste',
          epaId: 'TXD987654321',
          address: '123 Main St',
        },
        { route: { distance: 150, method: 'truck' } },
        {
          generatorInfo: {
            name: 'Hospital',
            epaId: 'TXD111222333',
            address: '123 Medical',
            contactName: 'Dr. Johnson',
          },
        }
      );
      testManifestId = manifest.id;
    });

    it('should update manifest status', async () => {
      const result = await updateManifestStatus(testManifestId, 'submitted');

      expect(result.status).toBe('submitted');
    });

    it('should add audit trail entry when updating status', async () => {
      const result = await updateManifestStatus(testManifestId, 'submitted');

      const statusEvent = result.auditTrail.find(
        (event) => event.action === 'status_changed_draft_to_submitted'
      );

      expect(statusEvent).toBeDefined();
      expect(statusEvent.details.previousStatus).toBe('draft');
      expect(statusEvent.details.newStatus).toBe('submitted');
    });
  });
});
