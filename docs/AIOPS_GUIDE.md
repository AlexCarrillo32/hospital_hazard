# AI Operations (AIOps) Guide

This guide explains how to use the comprehensive AIOps framework included in the Waste Compliance Agent.

## Overview

The AIOps framework provides production-grade capabilities for AI systems:

1. **Instrumentation** - Logging, tracing, and cost tracking
2. **Evaluation** - Offline testing and A/B experiments
3. **Safety** - Jailbreak detection, PII scrubbing, toxicity filtering
4. **Reliability** - Caching, retries, shadow deployments
5. **Lifecycle** - Drift detection and retraining triggers
6. **Optimization** - Model routing, budgets, batching
7. **Orchestration** - Multi-step workflows and agent coordination

## Quick Start

```javascript
import {
  instrumentation,
  evaluator,
  safetyLayer,
  reliabilityLayer,
  lifecycleManager,
  optimizer,
  orchestrator,
} from './services/ai/index.js';

// See aiops-example.js for complete working examples
```

## 1. Instrumentation & Logging

### Purpose

Track all AI interactions for debugging, cost analysis, and compliance.

### Usage

```javascript
import { instrumentation } from './services/ai/instrumentation.js';

// Log prompt before sending to model
instrumentation.logPrompt(traceId, prompt, {
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  maxTokens: 4096,
});

// Log output after receiving response
instrumentation.logOutput(traceId, output, {
  model: 'claude-3-5-sonnet-20241022',
  tokensUsed: 1500,
  latencyMs: 2300,
});

// Get aggregated metrics
const metrics = instrumentation.getMetrics();
console.log(metrics);
// {
//   totalRequests: 150,
//   totalTokens: 225000,
//   totalCost: 3.375,
//   averageLatency: 1850,
//   errorRate: 0.02
// }
```

### Features

- Automatic PII sanitization in logs
- Per-model cost calculation
- Trace ID for end-to-end debugging
- Aggregated metrics

## 2. Evaluation & Testing

### Purpose

Validate AI performance before and after changes using offline test sets and A/B tests.

### Offline Evaluation

```javascript
import { evaluator } from './services/ai/evaluation.js';

// Register test set
evaluator.registerTestSet('waste-classification-v1', [
  {
    id: 'test-1',
    input: 'Chemical: Acetone, Flash Point: 0°F',
    expected: {
      type: 'contains',
      values: ['D001', 'ignitable'],
    },
    threshold: 0.9,
  },
]);

// Run evaluation
const results = await evaluator.runOfflineEvaluation(
  'waste-classification-v1',
  classifyWasteFn
);

console.log(results.summary);
// {
//   testSet: 'waste-classification-v1',
//   totalCases: 10,
//   passed: 9,
//   avgScore: 0.95,
//   avgLatency: 1200
// }
```

### A/B Testing

```javascript
// Create A/B test
evaluator.createABTest(
  'prompt-comparison',
  { name: 'original-prompt', ...config },
  { name: 'improved-prompt', ...config },
  0.5 // 50/50 split
);

// Select variant for user
const variant = evaluator.selectVariant('prompt-comparison', userId);

// Record result
evaluator.recordABTestResult('prompt-comparison', variant, success, latencyMs);

// Get results
const testResults = evaluator.getABTestResults('prompt-comparison');
console.log(testResults.winner); // 'variantA', 'variantB', or 'tie'
```

## 3. Safety Layer

### Purpose

Protect against malicious inputs, PII leaks, and toxic content.

### Usage

```javascript
import { safetyLayer } from './services/ai/safety.js';

// Filter input before sending to model
const inputCheck = await safetyLayer.filterInput(userInput, { traceId });

if (!inputCheck.safe) {
  console.error('Unsafe input:', inputCheck.issues);
  // issues: [{ type: 'jailbreak_attempt', severity: 'high', ... }]
  throw new Error('Input rejected by safety layer');
}

// Use scrubbed input (PII removed)
const scrubbedInput = inputCheck.scrubbedInput;

// Filter output before returning to user
const outputCheck = await safetyLayer.filterOutput(modelOutput, { traceId });

if (outputCheck.issues.some((i) => i.type === 'pii_leaked')) {
  console.error('PII detected in model output!');
}
```

### Checks Performed

| Check                   | Type         | Action                  |
| ----------------------- | ------------ | ----------------------- |
| Jailbreak attempts      | Input        | Reject request          |
| PII (SSN, email, phone) | Input/Output | Scrub with placeholders |
| Toxicity                | Input        | Score and log           |
| Model refusal           | Output       | Log for analysis        |

### Customization

```javascript
// Add custom jailbreak pattern
safetyLayer.addJailbreakPattern('bypass all security');

// Add custom PII pattern
safetyLayer.addPIIPattern('custom_id', /CUST-\d{8}/g);
```

## 4. Reliability Layer

### Purpose

Handle failures gracefully with retries, caching, and shadow deployments.

### Basic Usage

```javascript
import { reliabilityLayer } from './services/ai/reliability.js';

const { result, fromCache } = await reliabilityLayer.executeWithReliability(
  modelCallFn,
  {
    traceId,
    cacheKey: 'waste-classify-abc123',
    cacheTtlMs: 3600000, // 1 hour
    enableCache: true,
    enableRetry: true,
  }
);
```

### Batching

```javascript
const requests = [
  { fn: () => classifyWaste(report1), options: { traceId: 'trace-1' } },
  { fn: () => classifyWaste(report2), options: { traceId: 'trace-2' } },
  // ... 100 more requests
];

const results = await reliabilityLayer.batchExecute(requests, {
  batchSize: 20,
  delayBetweenBatchesMs: 100,
});
```

### Shadow Deployments

```javascript
const { result } = await reliabilityLayer.executeWithReliability(
  primaryModelFn,
  {
    enableShadowDeploy: true,
    shadowFn: newModelFn,
  }
);

// Get comparison results
const shadowResults = reliabilityLayer.getShadowDeploymentResults();
console.log(shadowResults);
// [{ primaryResult, shadowResult, comparison: { match: true, similarity: 0.98 } }]
```

## 5. Lifecycle Management

### Purpose

Detect model drift and trigger retraining.

### Setup

```javascript
import { lifecycleManager } from './services/ai/lifecycle.js';

// Register drift detector
lifecycleManager.registerDriftDetector('accuracy-drift', {
  metricName: 'classification_accuracy',
  windowSize: 1000, // Track last 1000 samples
  threshold: 0.15, // Alert if drift > 15%
  checkIntervalMs: 300000, // Check every 5 minutes
});

// Register retraining trigger
lifecycleManager.registerRetrainingTrigger('low-confidence', () => {
  const recentLowConfidence = getRecentLowConfidenceRate();
  return recentLowConfidence > 0.2; // Trigger if >20% low confidence
});
```

### Recording Metrics

```javascript
// Record accuracy for each prediction
lifecycleManager.recordMetric('accuracy-drift', accuracy, {
  wasteCode: result.wasteCode,
  timestamp: Date.now(),
});
```

### Monitoring

```javascript
// Get drift report
const driftReport = lifecycleManager.getDriftReport();
console.log(driftReport);
// [{
//   detector: 'accuracy-drift',
//   driftScore: 0.18,
//   driftDetected: true,
//   baseline: { mean: 0.95, stdDev: 0.03 },
//   current: { mean: 0.79, stdDev: 0.08 }
// }]

// Check retraining triggers
const triggers = lifecycleManager.checkRetrainingTriggers();
if (triggers.length > 0) {
  console.log('Retraining needed:', triggers);
  // Start retraining process
}
```

## 6. Cost & Performance Optimization

### Purpose

Minimize costs while meeting performance requirements.

### Model Registration

```javascript
import { optimizer } from './services/ai/optimization.js';

// Register available models
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
```

### Routing Rules

```javascript
// Route long documents to Sonnet
optimizer.addRoutingRule({
  priority: 100,
  condition: (req) => req.documentSize > 50000,
  modelName: 'claude-sonnet',
});

// Route low-priority requests to Haiku
optimizer.addRoutingRule({
  priority: 50,
  condition: (req) => req.prioritizeCost,
  modelName: 'claude-haiku',
});
```

### Budget Enforcement

```javascript
// Set daily budget
optimizer.setBudget('daily-ai-budget', {
  maxCostPerDay: 100.0,
  maxRequestsPerDay: 10000,
  maxTokensPerDay: 50000000,
});

// Check before making request
const budgetCheck = optimizer.checkBudget(
  'daily-ai-budget',
  estimatedCost,
  estimatedTokens
);

if (!budgetCheck.allowed) {
  throw new Error(`Budget exceeded: ${budgetCheck.reason}`);
}

// Record actual usage
optimizer.recordUsage(modelName, actualCost, actualTokens, latencyMs);
```

### Model Selection

```javascript
const selectedModel = optimizer.selectOptimalModel({
  estimatedTokens: 5000,
  requiresCapability: 'document-analysis',
  budget: 0.5,
  latencyBudgetMs: 3000,
  prioritizeCost: true,
});
```

## 7. Agent Orchestration

### Purpose

Coordinate multi-step workflows with multiple AI agents.

### Agent Registration

```javascript
import { orchestrator } from './services/ai/orchestrator.js';

// Register individual agents
orchestrator.registerAgent('waste-classifier', async (input, context) => {
  const classification = await classifyWaste(input);
  return classification;
});

orchestrator.registerAgent(
  'facility-matcher',
  async (classification, context) => {
    const facilities = await findFacilities(classification.wasteCode);
    return { facilities };
  }
);

orchestrator.registerAgent('route-optimizer', async (facilityData, context) => {
  const bestRoute = await optimizeRoute(facilityData.facilities);
  return bestRoute;
});
```

### Workflow Definition

```javascript
orchestrator.defineWorkflow('complete-waste-profile', [
  {
    name: 'classify-waste',
    agent: 'waste-classifier',
    input: (ctx) => ctx.input,
  },
  {
    name: 'find-facilities',
    agent: 'facility-matcher',
    input: (ctx) => ctx.output, // Use previous step output
    retryOnFailure: true,
    maxRetries: 3,
  },
  {
    name: 'optimize-route',
    agent: 'route-optimizer',
    input: (ctx) => ctx.output,
    condition: (ctx) => ctx.output.facilities.length > 0, // Skip if no facilities
  },
]);
```

### Execution

```javascript
// Execute workflow
const result = await orchestrator.executeWorkflow(
  'complete-waste-profile',
  labReportText
);

console.log(result);
// {
//   input: '...',
//   output: { wasteCode: 'D001', ... },
//   facilities: [...],
//   facility: {...},
//   route: 'direct-transport'
// }

// Monitor execution
const execution = orchestrator.getExecutionStatus(executionId);
console.log(execution.status); // 'running', 'completed', or 'failed'

// Get statistics
const stats = orchestrator.getWorkflowStats('complete-waste-profile');
console.log(stats);
// {
//   totalExecutions: 150,
//   successful: 145,
//   failed: 5,
//   running: 0
// }
```

### Parallel Execution

```javascript
const results = await orchestrator.executeParallel(
  ['agent-1', 'agent-2', 'agent-3'],
  [input1, input2, input3],
  { timeout: 30000 }
);
```

## Complete Example

See [aiops-example.js](../src/services/ai/aiops-example.js) for a complete working example that integrates all components.

## Monitoring Dashboard

Get comprehensive metrics across all AIOps components:

```javascript
import { getAIOpsMetrics } from './services/ai/aiops-example.js';

const metrics = getAIOpsMetrics();
console.log(JSON.stringify(metrics, null, 2));
```

Output:

```json
{
  "instrumentation": {
    "totalRequests": 1523,
    "totalTokens": 2284500,
    "totalCost": 34.27,
    "averageLatency": 1842,
    "errorRate": 0.013
  },
  "modelStats": [
    {
      "name": "claude-sonnet",
      "requestCount": 892,
      "totalCost": 28.15,
      "avgCost": 0.0316,
      "avgLatency": 2103
    },
    {
      "name": "claude-haiku",
      "requestCount": 631,
      "totalCost": 6.12,
      "avgCost": 0.0097,
      "avgLatency": 1423
    }
  ],
  "budgetStatus": [
    {
      "name": "daily-ai-budget",
      "currentCost": 34.27,
      "maxCost": 100.0,
      "costUtilization": 34.27
    }
  ],
  "driftReport": [
    {
      "detector": "accuracy-drift",
      "driftScore": 0.08,
      "driftDetected": false
    }
  ],
  "retrainingStatus": []
}
```

## Best Practices

1. **Always use trace IDs** - Enable end-to-end debugging
2. **Set budgets early** - Prevent runaway costs
3. **Start with offline evaluation** - Before deploying new prompts/models
4. **Monitor drift continuously** - Don't wait for user complaints
5. **Use shadow deployments** - Test new models risk-free
6. **Implement safety layers** - Protect users and comply with regulations
7. **Cache aggressively** - Reduce costs for repeated requests
8. **Batch when possible** - Improve throughput and reduce overhead

## Integration with Waste Compliance

The AIOps framework is specifically designed for the waste compliance use case:

- **Compliance logging** - Full audit trail for EPA requirements (CS-2)
- **PII protection** - Scrub sensitive chemical and facility data
- **Cost control** - Stay within EHS department budgets
- **Accuracy monitoring** - Detect when waste code classifications degrade
- **Human-in-the-loop** - Never auto-approve (CS-1)

## Next Steps

1. Review [aiops-example.js](../src/services/ai/aiops-example.js)
2. Integrate instrumentation into existing services
3. Create offline test sets for your use cases
4. Set up monitoring dashboards
5. Configure budgets and alerts
