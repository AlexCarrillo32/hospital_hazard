import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ai-instrumentation');

export class AIInstrumentation {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      totalLatency: 0,
      errors: 0,
    };
  }

  logPrompt(traceId, prompt, metadata = {}) {
    logger.info({
      traceId,
      type: 'prompt',
      timestamp: new Date().toISOString(),
      model: metadata.model,
      temperature: metadata.temperature,
      maxTokens: metadata.maxTokens,
      promptLength: prompt.length,
      prompt: this._sanitizePrompt(prompt),
    });
  }

  logOutput(traceId, output, metadata = {}) {
    const tokensUsed = metadata.tokensUsed || 0;
    const cost = this._calculateCost(metadata.model, tokensUsed);

    this.metrics.totalRequests += 1;
    this.metrics.totalTokens += tokensUsed;
    this.metrics.totalCost += cost;

    logger.info({
      traceId,
      type: 'output',
      timestamp: new Date().toISOString(),
      model: metadata.model,
      tokensUsed,
      cost,
      latencyMs: metadata.latencyMs,
      outputLength: output.length,
      output: this._sanitizeOutput(output),
    });
  }

  logError(traceId, error, metadata = {}) {
    this.metrics.errors += 1;

    logger.error({
      traceId,
      type: 'error',
      timestamp: new Date().toISOString(),
      model: metadata.model,
      error: error.message,
      stack: error.stack,
      retryCount: metadata.retryCount,
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageLatency:
        this.metrics.totalRequests > 0
          ? this.metrics.totalLatency / this.metrics.totalRequests
          : 0,
      errorRate:
        this.metrics.totalRequests > 0
          ? this.metrics.errors / this.metrics.totalRequests
          : 0,
    };
  }

  _calculateCost(model, tokens) {
    const pricing = {
      'claude-3-5-sonnet-20241022': {
        input: 3.0 / 1_000_000,
        output: 15.0 / 1_000_000,
      },
      'claude-3-haiku-20240307': {
        input: 0.25 / 1_000_000,
        output: 1.25 / 1_000_000,
      },
      'gpt-4-turbo': { input: 10.0 / 1_000_000, output: 30.0 / 1_000_000 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-haiku-20240307'];
    return tokens * modelPricing.output;
  }

  _sanitizePrompt(prompt) {
    return prompt
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{9,12}\b/g, '[ID]');
  }

  _sanitizeOutput(output) {
    return this._sanitizePrompt(output);
  }
}

export const instrumentation = new AIInstrumentation();
