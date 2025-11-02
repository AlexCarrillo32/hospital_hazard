import { classifyWaste, generateWasteProfile } from '../../src/services/wasteClassifier.js';

describe('wasteClassifier', () => {
  describe('classifyWaste', () => {
    const mockLabReport = `
      HAZARDOUS WASTE ANALYSIS REPORT
      Chemical Composition:
      - Acetone: 85%
      - Isopropyl Alcohol: 10%
      Flash Point: 0°F
    `;

    it('should classify waste from lab report', async () => {
      const result = await classifyWaste(mockLabReport);

      expect(result).toEqual(
        expect.objectContaining({
          wasteCode: expect.any(String),
          category: expect.any(String),
          confidence: expect.any(Number),
          reasoning: expect.any(String),
          traceId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should return D001 for ignitable waste (acetone)', async () => {
      const result = await classifyWaste(mockLabReport);

      expect(result.wasteCode).toBe('D001');
      expect(result.category).toBe('ignitable');
    });

    it('should include confidence score between 0 and 1', async () => {
      const result = await classifyWaste(mockLabReport);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should flag for human review if confidence is low', async () => {
      const result = await classifyWaste(mockLabReport);

      if (result.confidence < 0.8) {
        expect(result.requiresHumanReview).toBe(true);
      } else {
        expect(result.requiresHumanReview).toBe(false);
      }
    });

    it('should include timestamp in ISO format', async () => {
      const result = await classifyWaste(mockLabReport);

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('generateWasteProfile', () => {
    const mockClassification = {
      wasteCode: 'D001',
      category: 'ignitable',
      confidence: 0.92,
      reasoning: 'Waste contains acetone with low flash point',
      chemicalsDetected: ['Acetone', 'Isopropyl Alcohol'],
      physicalProperties: {
        flashPoint: 0,
        pH: 7.2,
        physicalState: 'liquid',
      },
    };

    it('should generate waste profile from classification', async () => {
      const result = await generateWasteProfile(mockClassification);

      expect(result).toEqual(
        expect.objectContaining({
          wasteCode: 'D001',
          category: 'ignitable',
          profileDocument: expect.any(String),
          generatedAt: expect.any(String),
          status: 'pending_review',
          traceId: expect.any(String),
        })
      );
    });

    it('should always set status to pending_review', async () => {
      const result = await generateWasteProfile(mockClassification);

      expect(result.status).toBe('pending_review');
    });

    it('should include classification data', async () => {
      const result = await generateWasteProfile(mockClassification);

      expect(result.classification).toMatchObject({
        wasteCode: 'D001',
        category: 'ignitable',
        confidence: 0.92,
      });
    });

    it('should generate non-empty profile document', async () => {
      const result = await generateWasteProfile(mockClassification);

      expect(result.profileDocument).toBeTruthy();
      expect(result.profileDocument.length).toBeGreaterThan(0);
    });
  });
});
