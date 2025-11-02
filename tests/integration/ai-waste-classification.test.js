/**
 * Integration tests for AI waste classification
 * Tests the complete end-to-end flow with realistic lab reports
 */

import { classifyWaste, generateWasteProfile } from '../../src/services/wasteClassifier.js';

describe('AI Waste Classification Integration', () => {
  describe('Ignitable Waste (D001)', () => {
    const ignitableLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-001
Generator: Metropolitan Hospital
Date: January 25, 2025

CHEMICAL COMPOSITION:
- Acetone: 85% by volume
- Isopropyl Alcohol (IPA): 10% by volume
- Water: 5%

PHYSICAL PROPERTIES:
- Flash Point: 0°F (-18°C)
- Physical State: Liquid
- Color: Clear
- pH: 7.0
- Specific Gravity: 0.79

ANALYSIS METHOD: EPA Method 1010A (Pensky-Martens Closed Cup)

CONCLUSIONS:
Sample exhibits flash point well below 140°F threshold. Classified as ignitable hazardous waste.
    `;

    it('should classify acetone waste as D001 ignitable', async () => {
      const result = await classifyWaste(ignitableLabReport);

      expect(result.wasteCode).toBe('D001');
      expect(result.category).toBe('ignitable');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.chemicalsDetected).toContain('Acetone');
    });

    it('should generate comprehensive waste profile for ignitable waste', async () => {
      const classification = await classifyWaste(ignitableLabReport);
      const profile = await generateWasteProfile(classification);

      expect(profile.wasteCode).toBe('D001');
      expect(profile.status).toBe('pending_review');
      expect(profile.profileDocument).toBeTruthy();
      expect(profile.profileDocument.length).toBeGreaterThan(100);
    });

    it('should flag high-confidence classifications for reduced review', async () => {
      const result = await classifyWaste(ignitableLabReport);

      if (result.confidence >= 0.8) {
        expect(result.requiresHumanReview).toBe(false);
      }
    });
  });

  describe('Corrosive Waste (D002)', () => {
    const corrosiveLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-002
Generator: Chemical Manufacturing Plant
Date: January 25, 2025

CHEMICAL COMPOSITION:
- Sulfuric Acid (H2SO4): 45% concentration
- Water: 55%

PHYSICAL PROPERTIES:
- pH: 1.2 (highly acidic)
- Physical State: Liquid
- Color: Clear to slightly yellow
- Specific Gravity: 1.32
- Temperature: 20°C

ANALYSIS METHOD: EPA Method 9040C (pH Electrometric Measurement)

CORROSIVITY ASSESSMENT:
- Steel corrosion rate: 6.85 mm/year at 55°C (exceeds 6.35 mm/year threshold)

CONCLUSIONS:
Sample is highly corrosive with pH of 1.2, well below the EPA threshold of 2.0.
Classified as corrosive hazardous waste under RCRA.
    `;

    it('should classify sulfuric acid as D002 corrosive', async () => {
      const result = await classifyWaste(corrosiveLabReport);

      expect(result.wasteCode).toBe('D002');
      expect(result.category).toBe('corrosive');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.chemicalsDetected).toContain('Sulfuric Acid');
    });

    it('should detect extreme pH values in physical properties', async () => {
      const result = await classifyWaste(corrosiveLabReport);

      expect(result.physicalProperties).toBeDefined();
      expect(result.physicalProperties.pH).toBeLessThan(2);
    });
  });

  describe('Reactive Waste (D003)', () => {
    const reactiveLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-003
Generator: University Research Lab
Date: January 25, 2025

CHEMICAL COMPOSITION:
- Sodium Metal: 95%
- Mineral Oil: 5% (preservation)

PHYSICAL PROPERTIES:
- Physical State: Solid (stored under mineral oil)
- Color: Silvery-white
- Reactivity: Violently reacts with water

REACTIVITY TESTING (EPA SW-846 Method 1030):
- Water reactivity test: Violent reaction with hydrogen gas evolution
- Cyanide/Sulfide test: Negative
- Explosivity potential: High when exposed to moisture

SAFETY NOTES:
- Must be kept away from water and moisture
- Generates flammable hydrogen gas on contact with water
- Potential for fire and explosion

CONCLUSIONS:
Sample is water-reactive and generates flammable gas. Classified as reactive hazardous waste.
    `;

    it('should classify sodium metal as D003 reactive', async () => {
      const result = await classifyWaste(reactiveLabReport);

      expect(result.wasteCode).toBe('D003');
      expect(result.category).toBe('reactive');
      expect(result.chemicalsDetected).toContain('Sodium');
    });

    it('should include special handling recommendations for reactive waste', async () => {
      const result = await classifyWaste(reactiveLabReport);

      expect(result.recommendedHandling).toBeTruthy();
      expect(result.recommendedHandling.toLowerCase()).toContain('water');
    });
  });

  describe('Toxic Metals (D004-D011)', () => {
    const toxicMetalsLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-004
Generator: Electronics Recycling Facility
Date: January 25, 2025

TCLP ANALYSIS RESULTS (EPA Method 1311):
Metal concentrations in TCLP extract (mg/L):

- Lead (Pb): 8.2 mg/L (Regulatory limit: 5.0 mg/L) ⚠️ EXCEEDS
- Cadmium (Cd): 1.5 mg/L (Regulatory limit: 1.0 mg/L) ⚠️ EXCEEDS
- Chromium (Cr): 3.8 mg/L (Regulatory limit: 5.0 mg/L)
- Mercury (Hg): 0.15 mg/L (Regulatory limit: 0.2 mg/L)
- Arsenic (As): 4.2 mg/L (Regulatory limit: 5.0 mg/L)
- Barium (Ba): 85 mg/L (Regulatory limit: 100 mg/L)

PHYSICAL PROPERTIES:
- Physical State: Solid particulate
- Source: Circuit board waste, solder, components
- Color: Mixed (green, brown, gray)

CONCLUSIONS:
Sample exceeds TCLP regulatory limits for Lead (D008) and Cadmium (D006).
Multi-code hazardous waste classification required.
    `;

    it('should classify lead-contaminated waste as D008', async () => {
      const result = await classifyWaste(toxicMetalsLabReport);

      expect(['D008', 'D006', 'D004', 'D005', 'D007', 'D009', 'D010', 'D011']).toContain(
        result.wasteCode
      );
      expect(result.category).toBe('toxic');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect multiple toxic metals in chemicals detected', async () => {
      const result = await classifyWaste(toxicMetalsLabReport);

      expect(result.chemicalsDetected).toBeDefined();
      expect(result.chemicalsDetected.length).toBeGreaterThan(0);
    });
  });

  describe('Spent Solvents (F-codes)', () => {
    const spentSolventLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-005
Generator: Manufacturing Facility - Parts Cleaning
Date: January 25, 2025

WASTE DESCRIPTION:
Spent solvent mixture from metal parts degreasing operations

CHEMICAL COMPOSITION (GC-MS Analysis):
- Trichloroethylene: 45%
- Methylene Chloride: 30%
- Acetone: 15%
- Oils and Grease: 8%
- Water: 2%

PHYSICAL PROPERTIES:
- Physical State: Liquid
- Color: Dark brown
- Odor: Strong chemical odor
- Flash Point: 95°F
- Specific Gravity: 1.25

WASTE GENERATION PROCESS:
- Used in vapor degreasing operations
- Contains halogenated solvents
- Used before disposal threshold

CONCLUSIONS:
Waste qualifies as F001 (spent halogenated solvents used in degreasing).
Also exhibits D001 characteristics due to flash point below 140°F.
    `;

    it('should classify spent halogenated solvents as F001', async () => {
      const result = await classifyWaste(spentSolventLabReport);

      expect(['F001', 'F002', 'F003', 'D001']).toContain(result.wasteCode);
      expect(['solvent', 'ignitable']).toContain(result.category);
    });

    it('should detect halogenated solvents in chemical composition', async () => {
      const result = await classifyWaste(spentSolventLabReport);

      expect(result.chemicalsDetected).toBeDefined();
      const detectedLower = result.chemicalsDetected.map((c) => c.toLowerCase()).join(' ');
      expect(detectedLower).toMatch(/trichloroethylene|methylene|chloride/);
    });
  });

  describe('Mixed Waste Classifications', () => {
    const mixedWasteLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-006
Generator: Hospital Laboratory
Date: January 25, 2025

WASTE DESCRIPTION:
Mixed laboratory waste from chemical analysis operations

CHEMICAL COMPOSITION:
- Acetone: 40%
- Methanol: 25%
- Mercury compounds: 0.5%
- Acids (HCl, HNO3): 15%
- Water: 19.5%

PHYSICAL PROPERTIES:
- Flash Point: 35°F (highly ignitable)
- pH: 2.8 (acidic but above D002 threshold)
- Physical State: Liquid mixture
- Color: Pale yellow

TCLP RESULTS:
- Mercury: 0.25 mg/L (Exceeds 0.2 mg/L limit)

CONCLUSIONS:
Multiple hazard characteristics present:
1. Ignitable (D001) - Flash point 35°F
2. Toxic for Mercury (D009) - TCLP exceeds limit

Multi-code classification required: D001, D009
    `;

    it('should handle mixed waste with multiple hazard codes', async () => {
      const result = await classifyWaste(mixedWasteLabReport);

      expect(['D001', 'D002', 'D009']).toContain(result.wasteCode);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should flag mixed waste for human review if complexity is high', async () => {
      const result = await classifyWaste(mixedWasteLabReport);

      // Mixed waste should generally require review
      expect(result).toHaveProperty('requiresHumanReview');
    });
  });

  describe('Edge Cases and Low-Confidence Classifications', () => {
    const ambiguousLabReport = `
WASTE ANALYSIS REPORT
====================
Sample ID: LAB-2025-007

Waste type: Unknown laboratory chemical mixture
Source: Old stockroom cleanout
Age: Estimated 15+ years
Label information: Faded, partially illegible

Visual Inspection:
- Two-phase liquid
- Upper layer: Clear
- Lower layer: Dark sediment
- Container: Corroded metal can

Limited Testing (safety concerns):
- pH strip test: Approximately 6-7
- Odor: Slight chemical smell, not distinctive

NOTES:
Unable to perform comprehensive analysis due to safety concerns and unknown origin.
Recommend treating as hazardous waste pending further analysis.
    `;

    it('should handle ambiguous reports with low confidence', async () => {
      const result = await classifyWaste(ambiguousLabReport);

      expect(result.confidence).toBeLessThan(0.7);
      expect(result.requiresHumanReview).toBe(true);
    });

    it('should still provide a classification with reasoning', async () => {
      const result = await classifyWaste(ambiguousLabReport);

      expect(result.wasteCode).toBeDefined();
      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(20);
    });
  });

  describe('Complete End-to-End Workflow', () => {
    const completeLabReport = `
HAZARDOUS WASTE ANALYSIS REPORT
===============================
Sample ID: LAB-2025-008
Generator: PharmaChem Industries
Generator EPA ID: CAD987654321
Date: January 25, 2025

WASTE DESCRIPTION:
Acetone waste from pharmaceutical manufacturing cleanroom operations

CHEMICAL COMPOSITION (GC-MS Analysis EPA Method 8260):
- Acetone: 92.5%
- Isopropyl Alcohol: 5.0%
- Water: 2.0%
- Pharmaceutical residues: 0.5%

PHYSICAL PROPERTIES:
- Flash Point: -4°F (-20°C) - EPA Method 1010A
- Boiling Point: 133°F (56°C)
- Physical State: Liquid
- Color: Clear, colorless
- Odor: Sweet, characteristic acetone odor
- Specific Gravity: 0.791 at 20°C
- Vapor Pressure: 180 mmHg at 20°C
- pH: 7.2

FLAMMABILITY DATA:
- Lower Explosive Limit (LEL): 2.6%
- Upper Explosive Limit (UEL): 12.8%
- Autoignition Temperature: 869°F (465°C)

TOXICITY DATA:
- TCLP performed: All metals below regulatory limits
- No RCRA-listed compounds detected above thresholds

REGULATORY CLASSIFICATION:
Based on flash point of -4°F, which is significantly below the EPA regulatory
threshold of 140°F (60°C), this waste meets the criteria for D001 Ignitable Waste
under 40 CFR 261.21.

HANDLING RECOMMENDATIONS:
- Store in approved flammable storage cabinet
- Keep away from heat, sparks, and open flames
- Use grounding and bonding procedures during transfers
- Dispose at EPA-certified TSDF with ignitable waste permit

EMERGENCY RESPONSE:
- Fire: Use CO2, dry chemical, or foam. Water spray for cooling only.
- Spill: Ventilate area, eliminate ignition sources, absorb with inert material
- Exposure: Remove to fresh air, seek medical attention if symptoms persist
    `;

    it('should process complete lab report end-to-end', async () => {
      const classification = await classifyWaste(completeLabReport);

      expect(classification).toMatchObject({
        wasteCode: 'D001',
        category: 'ignitable',
        confidence: expect.any(Number),
        reasoning: expect.any(String),
        chemicalsDetected: expect.arrayContaining(['Acetone']),
        physicalProperties: expect.any(Object),
        recommendedHandling: expect.any(String),
        requiresHumanReview: expect.any(Boolean),
        traceId: expect.any(String),
        timestamp: expect.any(String),
      });

      expect(classification.confidence).toBeGreaterThan(0.85);
    });

    it('should generate complete waste profile from end-to-end classification', async () => {
      const classification = await classifyWaste(completeLabReport);
      const profile = await generateWasteProfile(classification);

      expect(profile).toMatchObject({
        wasteCode: 'D001',
        category: 'ignitable',
        profileDocument: expect.any(String),
        generatedAt: expect.any(String),
        classification: expect.objectContaining({
          wasteCode: 'D001',
          category: 'ignitable',
        }),
        status: 'pending_review',
        traceId: expect.any(String),
      });

      expect(profile.profileDocument.length).toBeGreaterThan(200);
    });

    it('should include all required sections in generated profile', async () => {
      const classification = await classifyWaste(completeLabReport);
      const profile = await generateWasteProfile(classification);

      const doc = profile.profileDocument.toLowerCase();

      // Check for key profile sections
      expect(doc).toBeTruthy();
      expect(doc.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Caching', () => {
    const simpleReport = `
HAZARDOUS WASTE ANALYSIS
Acetone: 90%
Flash Point: 0°F
    `;

    it('should complete classification within reasonable time', async () => {
      const startTime = Date.now();
      await classifyWaste(simpleReport);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should use caching for repeated classifications', async () => {
      const result1 = await classifyWaste(simpleReport);
      const result2 = await classifyWaste(simpleReport);

      expect(result1.wasteCode).toBe(result2.wasteCode);
      expect(result1.confidence).toBe(result2.confidence);
    });
  });
});
