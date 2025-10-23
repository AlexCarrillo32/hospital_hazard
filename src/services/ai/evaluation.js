import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ai-evaluation');

export class AIEvaluator {
  constructor() {
    this.testSets = new Map();
    this.abTests = new Map();
  }

  registerTestSet(name, testCases) {
    this.testSets.set(name, testCases);
    logger.info(`Registered test set: ${name} with ${testCases.length} cases`);
  }

  async runOfflineEvaluation(name, modelFn) {
    const testSet = this.testSets.get(name);
    if (!testSet) {
      throw new Error(`Test set not found: ${name}`);
    }

    const results = [];
    for (const testCase of testSet) {
      const startTime = Date.now();
      const output = await modelFn(testCase.input);
      const latencyMs = Date.now() - startTime;

      const score = this._evaluateOutput(output, testCase.expected);

      results.push({
        testCaseId: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        actual: output,
        score,
        latencyMs,
        passed: score >= testCase.threshold || 0.8,
      });
    }

    const summary = {
      testSet: name,
      totalCases: results.length,
      passed: results.filter((r) => r.passed).length,
      avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      avgLatency: results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length,
      timestamp: new Date().toISOString(),
    };

    logger.info({ summary, results }, 'Offline evaluation completed');
    return { summary, results };
  }

  createABTest(name, variantA, variantB, trafficSplit = 0.5) {
    this.abTests.set(name, {
      name,
      variantA: { ...variantA, requests: 0, successes: 0, totalLatency: 0 },
      variantB: { ...variantB, requests: 0, successes: 0, totalLatency: 0 },
      trafficSplit,
      createdAt: new Date().toISOString(),
    });

    logger.info(`Created A/B test: ${name} with ${trafficSplit * 100}% split`);
  }

  selectVariant(testName, userId) {
    const test = this.abTests.get(testName);
    if (!test) {
      throw new Error(`A/B test not found: ${testName}`);
    }

    const hash = this._hashUserId(userId);
    return hash < test.trafficSplit ? 'variantA' : 'variantB';
  }

  recordABTestResult(testName, variant, success, latencyMs) {
    const test = this.abTests.get(testName);
    if (!test) {
      return;
    }

    const variantData = test[variant];
    variantData.requests += 1;
    if (success) {
      variantData.successes += 1;
    }
    variantData.totalLatency += latencyMs;
  }

  getABTestResults(testName) {
    const test = this.abTests.get(testName);
    if (!test) {
      throw new Error(`A/B test not found: ${testName}`);
    }

    return {
      name: testName,
      variantA: this._calculateVariantStats(test.variantA),
      variantB: this._calculateVariantStats(test.variantB),
      winner: this._determineWinner(test.variantA, test.variantB),
    };
  }

  _evaluateOutput(actual, expected) {
    if (typeof expected === 'object' && expected.type === 'contains') {
      return expected.values.every((v) => actual.includes(v)) ? 1.0 : 0.0;
    }

    if (typeof expected === 'object' && expected.type === 'regex') {
      return new RegExp(expected.pattern).test(actual) ? 1.0 : 0.0;
    }

    const similarity = this._calculateSimilarity(String(actual), String(expected));
    return similarity;
  }

  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  _levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  _calculateVariantStats(variant) {
    return {
      requests: variant.requests,
      successRate: variant.requests > 0 ? variant.successes / variant.requests : 0,
      avgLatency: variant.requests > 0 ? variant.totalLatency / variant.requests : 0,
    };
  }

  _determineWinner(variantA, variantB) {
    const statsA = this._calculateVariantStats(variantA);
    const statsB = this._calculateVariantStats(variantB);

    if (statsA.requests < 100 || statsB.requests < 100) {
      return 'insufficient_data';
    }

    const scoreA = statsA.successRate * 0.7 + (1 / statsA.avgLatency) * 0.3;
    const scoreB = statsB.successRate * 0.7 + (1 / statsB.avgLatency) * 0.3;

    if (Math.abs(scoreA - scoreB) < 0.05) {
      return 'tie';
    }
    return scoreA > scoreB ? 'variantA' : 'variantB';
  }

  _hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100) / 100;
  }
}

export const evaluator = new AIEvaluator();
