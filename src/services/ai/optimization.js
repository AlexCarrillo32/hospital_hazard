import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ai-optimization');

export class AIOptimizer {
  constructor() {
    this.models = new Map();
    this.costBudgets = new Map();
    this.routingRules = [];
  }

  registerModel(name, config) {
    const {
      endpoint,
      costPerToken = 0,
      avgLatencyMs = 1000,
      maxTokens = 4096,
      capabilities = [],
    } = config;

    this.models.set(name, {
      name,
      endpoint,
      costPerToken,
      avgLatencyMs,
      maxTokens,
      capabilities,
      requestCount: 0,
      totalCost: 0,
      totalLatency: 0,
    });

    logger.info(`Registered model: ${name}`);
  }

  addRoutingRule(rule) {
    const { priority = 50, condition, modelName } = rule;

    this.routingRules.push({
      priority,
      condition,
      modelName,
    });

    this.routingRules.sort((a, b) => b.priority - a.priority);
    logger.info(
      `Added routing rule for ${modelName} with priority ${priority}`
    );
  }

  selectOptimalModel(request) {
    for (const rule of this.routingRules) {
      if (rule.condition(request)) {
        const model = this.models.get(rule.modelName);
        if (this._meetsConstraints(model, request)) {
          logger.info(
            {
              selectedModel: rule.modelName,
              reason: 'routing_rule',
            },
            'Model selected via routing rule'
          );
          return rule.modelName;
        }
      }
    }

    const candidateModels = Array.from(this.models.values()).filter((model) =>
      this._meetsConstraints(model, request)
    );

    if (candidateModels.length === 0) {
      logger.warn('No models meet constraints, using default');
      return Array.from(this.models.keys())[0];
    }

    const scored = candidateModels.map((model) => ({
      name: model.name,
      score: this._calculateScore(model, request),
    }));

    scored.sort((a, b) => b.score - a.score);

    logger.info(
      {
        selectedModel: scored[0].name,
        score: scored[0].score,
        candidates: scored.length,
      },
      'Model selected via scoring'
    );

    return scored[0].name;
  }

  setBudget(name, config) {
    const { maxCostPerDay, maxRequestsPerDay, maxTokensPerDay } = config;

    this.costBudgets.set(name, {
      maxCostPerDay,
      maxRequestsPerDay,
      maxTokensPerDay,
      currentCost: 0,
      currentRequests: 0,
      currentTokens: 0,
      resetAt: this._getNextMidnight(),
    });

    logger.info(`Set budget: ${name}`);
  }

  checkBudget(budgetName, estimatedCost, estimatedTokens) {
    const budget = this.costBudgets.get(budgetName);
    if (!budget) return { allowed: true };

    if (Date.now() > budget.resetAt) {
      this._resetBudget(budgetName);
    }

    const wouldExceedCost =
      budget.maxCostPerDay &&
      budget.currentCost + estimatedCost > budget.maxCostPerDay;
    const wouldExceedTokens =
      budget.maxTokensPerDay &&
      budget.currentTokens + estimatedTokens > budget.maxTokensPerDay;
    const wouldExceedRequests =
      budget.maxRequestsPerDay &&
      budget.currentRequests + 1 > budget.maxRequestsPerDay;

    if (wouldExceedCost || wouldExceedTokens || wouldExceedRequests) {
      logger.warn(
        {
          budget: budgetName,
          wouldExceedCost,
          wouldExceedTokens,
          wouldExceedRequests,
        },
        'Budget limit would be exceeded'
      );

      return {
        allowed: false,
        reason: wouldExceedCost
          ? 'cost_limit'
          : wouldExceedTokens
            ? 'token_limit'
            : 'request_limit',
      };
    }

    return { allowed: true };
  }

  recordUsage(modelName, cost, tokens, latencyMs) {
    const model = this.models.get(modelName);
    if (model) {
      model.requestCount += 1;
      model.totalCost += cost;
      model.totalLatency += latencyMs;
    }

    for (const budget of this.costBudgets.values()) {
      budget.currentCost += cost;
      budget.currentTokens += tokens;
      budget.currentRequests += 1;
    }
  }

  async batchRequests(requests, options = {}) {
    const { maxBatchSize = 20, delayBetweenBatchesMs = 100 } = options;

    const batches = [];
    for (let i = 0; i < requests.length; i += maxBatchSize) {
      batches.push(requests.slice(i, i + maxBatchSize));
    }

    logger.info(
      {
        totalRequests: requests.length,
        totalBatches: batches.length,
        maxBatchSize,
      },
      'Starting batch processing'
    );

    const results = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);

      logger.info(
        {
          batchNumber: i + 1,
          totalBatches: batches.length,
          successCount: batchResults.filter((r) => r.status === 'fulfilled')
            .length,
        },
        'Batch completed'
      );

      if (i < batches.length - 1) {
        await this._sleep(delayBetweenBatchesMs);
      }
    }

    return results;
  }

  _meetsConstraints(model, request) {
    if (
      request.requiresCapability &&
      !model.capabilities.includes(request.requiresCapability)
    ) {
      return false;
    }

    if (request.estimatedTokens && request.estimatedTokens > model.maxTokens) {
      return false;
    }

    if (request.budget) {
      const estimatedCost =
        (request.estimatedTokens || 1000) * model.costPerToken;
      if (estimatedCost > request.budget) {
        return false;
      }
    }

    if (
      request.latencyBudgetMs &&
      model.avgLatencyMs > request.latencyBudgetMs
    ) {
      return false;
    }

    return true;
  }

  _calculateScore(model, request) {
    const costWeight = request.prioritizeCost ? 0.7 : 0.3;
    const latencyWeight = request.prioritizeLatency ? 0.7 : 0.3;

    const costScore = 1 - model.costPerToken / this._getMaxCostPerToken();
    const latencyScore = 1 - model.avgLatencyMs / this._getMaxLatency();

    return costScore * costWeight + latencyScore * latencyWeight;
  }

  _getMaxCostPerToken() {
    return Math.max(
      ...Array.from(this.models.values()).map((m) => m.costPerToken)
    );
  }

  _getMaxLatency() {
    return Math.max(
      ...Array.from(this.models.values()).map((m) => m.avgLatencyMs)
    );
  }

  _getNextMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  _resetBudget(budgetName) {
    const budget = this.costBudgets.get(budgetName);
    if (budget) {
      budget.currentCost = 0;
      budget.currentRequests = 0;
      budget.currentTokens = 0;
      budget.resetAt = this._getNextMidnight();

      logger.info(`Budget reset: ${budgetName}`);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getModelStats() {
    return Array.from(this.models.values()).map((model) => ({
      name: model.name,
      requestCount: model.requestCount,
      totalCost: model.totalCost,
      avgCost:
        model.requestCount > 0 ? model.totalCost / model.requestCount : 0,
      avgLatency:
        model.requestCount > 0 ? model.totalLatency / model.requestCount : 0,
    }));
  }

  getBudgetStatus() {
    return Array.from(this.costBudgets.entries()).map(([name, budget]) => ({
      name,
      currentCost: budget.currentCost,
      maxCost: budget.maxCostPerDay,
      costUtilization: budget.maxCostPerDay
        ? (budget.currentCost / budget.maxCostPerDay) * 100
        : 0,
      currentRequests: budget.currentRequests,
      maxRequests: budget.maxRequestsPerDay,
      resetAt: new Date(budget.resetAt).toISOString(),
    }));
  }
}

export const optimizer = new AIOptimizer();
