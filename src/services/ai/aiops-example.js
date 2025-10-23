/**
 * Comprehensive AI Operations Example
 * Demonstrates how to use all AIOps components together
 */

import { instrumentation } from './instrumentation.js';
import { evaluator } from './evaluation.js';
import { safetyLayer } from './safety.js';
import { reliabilityLayer } from './reliability.js';
import { lifecycleManager } from './lifecycle.js';
import { optimizer } from './optimization.js';
import { orchestrator } from './orchestrator.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('aiops-example');

export async function setupWasteClassificationAIOps() {
  logger.info('Setting up AIOps for waste classification');

  optimizer.registerModel('claude-sonnet', {
    endpoint: process.env.AI_MODEL_ENDPOINT,
    costPerToken: 0.000015,
    avgLatencyMs: 2000,
    maxTokens: 200000,
    capabilities: ['long-context', 'document-analysis'],
  });

  optimizer.registerModel('claude-haiku', {
    endpoint: process.env.AI_MODEL_ENDPOINT_HAIKU,
    costPerToken: 0.00000125,
    avgLatencyMs: 800,
    maxTokens: 200000,
    capabilities: ['fast-inference'],
  });

  optimizer.addRoutingRule({
    priority: 100,
    condition: (req) => req.documentSize > 50000,
    modelName: 'claude-sonnet',
  });

  optimizer.addRoutingRule({
    priority: 50,
    condition: (req) => req.prioritizeLatency,
    modelName: 'claude-haiku',
  });

  optimizer.setBudget('daily-ai-budget', {
    maxCostPerDay: 100.0,
    maxRequestsPerDay: 10000,
    maxTokensPerDay: 50000000,
  });

  lifecycleManager.registerDriftDetector('accuracy-drift', {
    metricName: 'classification_accuracy',
    windowSize: 1000,
    threshold: 0.15,
    checkIntervalMs: 300000,
  });

  lifecycleManager.registerRetrainingTrigger('low-confidence', () => {
    const recentLowConfidence = 0.3;
    return recentLowConfidence > 0.2;
  });

  evaluator.registerTestSet('waste-classification-v1', [
    {
      id: 'test-1',
      input: 'Chemical: Acetone, Flash Point: 0°F, Quantity: 50kg',
      expected: {
        type: 'contains',
        values: ['D001', 'ignitable'],
      },
      threshold: 0.9,
    },
    {
      id: 'test-2',
      input: 'Chemical: Mercury, Concentration: 250ppm',
      expected: {
        type: 'contains',
        values: ['D009', 'toxic'],
      },
      threshold: 0.9,
    },
  ]);

  logger.info('AIOps setup complete');
}

export async function classifyWasteWithAIOps(labReportText, userId) {
  const traceId = `trace-${Date.now()}-${userId}`;

  logger.info({ traceId }, 'Starting waste classification with full AIOps');

  const inputSafetyCheck = await safetyLayer.filterInput(labReportText, {
    traceId,
  });

  if (!inputSafetyCheck.safe) {
    logger.error({ traceId, issues: inputSafetyCheck.issues }, 'Input failed safety check');
    throw new Error('Input contains unsafe content');
  }

  const selectedModel = optimizer.selectOptimalModel({
    estimatedTokens: labReportText.length / 4,
    requiresCapability: 'document-analysis',
    budget: 0.5,
    documentSize: labReportText.length,
  });

  const budgetCheck = optimizer.checkBudget('daily-ai-budget', 0.5, labReportText.length / 4);

  if (!budgetCheck.allowed) {
    logger.error({ traceId, reason: budgetCheck.reason }, 'Budget limit exceeded');
    throw new Error(`Budget limit exceeded: ${budgetCheck.reason}`);
  }

  const classificationFn = async () => {
    instrumentation.logPrompt(traceId, inputSafetyCheck.scrubbedInput, {
      model: selectedModel,
      temperature: 0.3,
      maxTokens: 4096,
    });

    const mockResult = {
      wasteCode: 'D001',
      category: 'ignitable',
      confidence: 0.92,
      reasoning: 'Acetone has flash point below 140°F',
    };

    instrumentation.logOutput(traceId, JSON.stringify(mockResult), {
      model: selectedModel,
      tokensUsed: 150,
      latencyMs: 1500,
    });

    return mockResult;
  };

  const { result: classificationResult } = await reliabilityLayer.executeWithReliability(
    classificationFn,
    {
      traceId,
      cacheKey: `waste-classify-${Buffer.from(labReportText).toString('base64').slice(0, 32)}`,
      cacheTtlMs: 3600000,
      enableCache: true,
      enableRetry: true,
    }
  );

  const outputSafetyCheck = await safetyLayer.filterOutput(JSON.stringify(classificationResult), {
    traceId,
  });

  if (!outputSafetyCheck.safe) {
    logger.error({ traceId, issues: outputSafetyCheck.issues }, 'Output failed safety check');
  }

  lifecycleManager.recordMetric('accuracy-drift', classificationResult.confidence, {
    wasteCode: classificationResult.wasteCode,
  });

  optimizer.recordUsage(selectedModel, 0.00225, 150, 1500);

  logger.info({ traceId, result: classificationResult }, 'Classification completed with AIOps');

  return {
    ...classificationResult,
    traceId,
    model: selectedModel,
    safetyChecks: {
      input: inputSafetyCheck.issues,
      output: outputSafetyCheck.issues,
    },
  };
}

export async function runWasteProfileWorkflow(labReportText, userId) {
  orchestrator.registerAgent('waste-classifier', async (input) => {
    return classifyWasteWithAIOps(input, userId);
  });

  orchestrator.registerAgent('facility-matcher', async (_classificationResult) => {
    return {
      facilities: [
        {
          id: 'fac-1',
          name: 'SafeWaste LLC',
          acceptsCodes: ['D001'],
          price: 2.5,
        },
        {
          id: 'fac-2',
          name: 'HazardPro Inc',
          acceptsCodes: ['D001'],
          price: 3.0,
        },
      ],
    };
  });

  orchestrator.registerAgent('route-optimizer', async (facilityData, _context) => {
    const bestFacility = facilityData.facilities[0];
    return {
      facility: bestFacility,
      estimatedCost: bestFacility.price * 100,
      route: 'direct-transport',
    };
  });

  orchestrator.defineWorkflow('complete-waste-profile', [
    {
      name: 'classify-waste',
      agent: 'waste-classifier',
      input: (ctx) => ctx.input,
    },
    {
      name: 'find-facilities',
      agent: 'facility-matcher',
      input: (ctx) => ctx.output,
    },
    {
      name: 'optimize-route',
      agent: 'route-optimizer',
      input: (ctx) => ctx.output,
    },
  ]);

  const result = await orchestrator.executeWorkflow('complete-waste-profile', labReportText);

  return result;
}

export async function runOfflineEvaluation() {
  logger.info('Running offline evaluation');

  const mockClassifyFn = async (input) => {
    if (input.includes('Acetone')) {
      return { wasteCode: 'D001', category: 'ignitable' };
    }
    if (input.includes('Mercury')) {
      return { wasteCode: 'D009', category: 'toxic' };
    }
    return { wasteCode: 'UNKNOWN', category: 'unknown' };
  };

  const evalResults = await evaluator.runOfflineEvaluation(
    'waste-classification-v1',
    mockClassifyFn
  );

  logger.info({ summary: evalResults.summary }, 'Evaluation complete');

  return evalResults;
}

export function getAIOpsMetrics() {
  return {
    instrumentation: instrumentation.getMetrics(),
    modelStats: optimizer.getModelStats(),
    budgetStatus: optimizer.getBudgetStatus(),
    driftReport: lifecycleManager.getDriftReport(),
    retrainingStatus: lifecycleManager.getRetrainingStatus(),
  };
}
