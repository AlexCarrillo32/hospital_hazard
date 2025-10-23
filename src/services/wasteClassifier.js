import { createLogger } from '../utils/logger.js';
import { defaultClaudeClient } from './ai/claudeClient.js';
import { lifecycleManager } from './ai/lifecycle.js';

const logger = createLogger('waste-classifier');

const EPA_WASTE_CODES = {
  D001: {
    category: 'ignitable',
    description: 'Ignitable waste (flash point < 140°F)',
    characteristics: ['flammable', 'combustible', 'oxidizer'],
  },
  D002: {
    category: 'corrosive',
    description: 'Corrosive waste (pH ≤ 2 or ≥ 12.5)',
    characteristics: ['acidic', 'alkaline', 'caustic'],
  },
  D003: {
    category: 'reactive',
    description: 'Reactive waste',
    characteristics: ['unstable', 'explosive', 'water-reactive', 'cyanide', 'sulfide'],
  },
  D004: { category: 'toxic', description: 'Arsenic toxicity' },
  D005: { category: 'toxic', description: 'Barium toxicity' },
  D006: { category: 'toxic', description: 'Cadmium toxicity' },
  D007: { category: 'toxic', description: 'Chromium toxicity' },
  D008: { category: 'toxic', description: 'Lead toxicity' },
  D009: { category: 'toxic', description: 'Mercury toxicity' },
  F001: {
    category: 'solvent',
    description: 'Spent halogenated solvents',
  },
  F002: {
    category: 'solvent',
    description: 'Spent halogenated solvents',
  },
  F003: {
    category: 'solvent',
    description: 'Spent non-halogenated solvents',
  },
  U001: {
    category: 'commercial-chemical',
    description: 'Acetaldehyde',
  },
};

export async function classifyWaste(labReportText, options = {}) {
  const { traceId = `waste-${Date.now()}`, userId = 'system' } = options;

  logger.info({ traceId, userId }, 'Classifying waste from lab report');

  const systemPrompt = `You are an expert EPA hazardous waste classifier. Your job is to analyze lab reports and classify waste according to RCRA regulations.

You have access to these EPA waste code categories:
- D001: Ignitable (flash point < 140°F)
- D002: Corrosive (pH ≤ 2 or ≥ 12.5)
- D003: Reactive (unstable, explosive, water-reactive)
- D004-D009: Toxic metals (Arsenic, Barium, Cadmium, Chromium, Lead, Mercury)
- F001-F003: Spent solvents
- U-codes: Commercial chemical products

Return classification with reasoning and confidence score.`;

  const schema = {
    wasteCode: 'string (EPA code like D001, D009)',
    category: 'string (ignitable, corrosive, reactive, toxic, solvent)',
    confidence: 'number (0.0 to 1.0)',
    reasoning: 'string (explanation of classification)',
    chemicalsDetected: 'array of strings',
    physicalProperties: 'object with pH, flashPoint, concentration, etc.',
    recommendedHandling: 'string',
  };

  const classification = await defaultClaudeClient.generateStructuredOutput(labReportText, schema, {
    traceId,
    systemPrompt,
    temperature: 0.2,
    maxTokens: 2048,
  });

  if (!EPA_WASTE_CODES[classification.wasteCode]) {
    logger.warn(
      { traceId, wasteCode: classification.wasteCode },
      'Unknown waste code returned by model'
    );
    classification.wasteCode = 'UNKNOWN';
    classification.confidence = 0.0;
  }

  lifecycleManager.recordMetric('classification-confidence', classification.confidence, {
    wasteCode: classification.wasteCode,
    userId,
  });

  logger.info(
    {
      traceId,
      wasteCode: classification.wasteCode,
      confidence: classification.confidence,
    },
    'Waste classification completed'
  );

  return {
    ...classification,
    traceId,
    timestamp: new Date().toISOString(),
    requiresHumanReview: classification.confidence < 0.8,
  };
}

export async function generateWasteProfile(classificationResult, options = {}) {
  const { traceId = classificationResult.traceId || `profile-${Date.now()}` } = options;

  logger.info({ traceId }, 'Generating EPA waste profile');

  const systemPrompt = `You are an EPA waste profile documentation expert. Generate comprehensive, compliant waste profiles for RCRA manifests.

Include all required sections:
1. Waste Identification
2. Hazard Characteristics
3. Chemical Composition
4. Physical State
5. Generator Information
6. Treatment/Disposal Recommendations
7. Emergency Response Procedures

Be detailed and use proper EPA terminology.`;

  const prompt = `Generate a complete EPA waste profile based on this classification:

Waste Code: ${classificationResult.wasteCode}
Category: ${classificationResult.category}
Chemicals: ${classificationResult.chemicalsDetected?.join(', ') || 'Not specified'}
Physical Properties: ${JSON.stringify(classificationResult.physicalProperties || {}, null, 2)}
Classification Reasoning: ${classificationResult.reasoning}

Generate a comprehensive waste profile document (100+ words minimum) that would satisfy EPA RCRA requirements.`;

  const profileDocument = await defaultClaudeClient.generateCompletion(prompt, {
    traceId,
    systemPrompt,
    temperature: 0.4,
    maxTokens: 4096,
  });

  const profile = {
    wasteCode: classificationResult.wasteCode,
    category: classificationResult.category,
    profileDocument,
    generatedAt: new Date().toISOString(),
    classification: classificationResult,
    status: 'pending_review',
    traceId,
  };

  logger.info({ traceId, wasteCode: profile.wasteCode }, 'Waste profile generated');

  return profile;
}

export function getWasteCodeInfo(wasteCode) {
  return EPA_WASTE_CODES[wasteCode] || null;
}

export function getAllWasteCodes() {
  return EPA_WASTE_CODES;
}
