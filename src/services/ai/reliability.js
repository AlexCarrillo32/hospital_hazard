import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ai-reliability');

export class AIReliabilityLayer {
  constructor() {
    this.cache = new Map();
    this.shadowDeployments = new Map();
    this.maxRetries = 3;
    this.baseDelayMs = 1000;
  }

  async executeWithReliability(fn, options = {}) {
    const {
      traceId,
      cacheKey,
      cacheTtlMs = 3600000,
      enableCache = true,
      enableRetry = true,
      enableShadowDeploy = false,
      shadowFn = null,
    } = options;

    if (enableCache && cacheKey) {
      const cached = this._getCached(cacheKey);
      if (cached) {
        logger.info({ traceId, cacheKey }, 'Cache hit');
        return { result: cached, fromCache: true };
      }
    }

    let result;
    let error;

    for (let attempt = 0; attempt < (enableRetry ? this.maxRetries : 1); attempt++) {
      try {
        const startTime = Date.now();
        result = await fn();
        const latencyMs = Date.now() - startTime;

        logger.info({ traceId, attempt, latencyMs }, 'Request succeeded');

        if (enableCache && cacheKey) {
          this._setCache(cacheKey, result, cacheTtlMs);
        }

        break;
      } catch (err) {
        error = err;
        logger.warn(
          {
            traceId,
            attempt,
            error: err.message,
          },
          'Request failed, retrying...'
        );

        if (attempt < this.maxRetries - 1) {
          const delayMs = this._calculateBackoff(attempt);
          await this._sleep(delayMs);
        }
      }
    }

    if (error && !result) {
      logger.error({ traceId, error: error.message }, 'All retries exhausted');
      throw error;
    }

    if (enableShadowDeploy && shadowFn) {
      this._executeShadow(traceId, shadowFn, result);
    }

    return { result, fromCache: false };
  }

  async batchExecute(requests, options = {}) {
    const { batchSize = 10, delayBetweenBatchesMs = 100 } = options;

    const results = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map((req) => this.executeWithReliability(req.fn, req.options))
      );

      results.push(...batchResults);

      if (i + batchSize < requests.length) {
        await this._sleep(delayBetweenBatchesMs);
      }

      logger.info(
        {
          batchNumber: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(requests.length / batchSize),
        },
        'Batch completed'
      );
    }

    return results;
  }

  _getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  _setCache(key, value, ttlMs) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  _calculateBackoff(attempt) {
    const jitter = Math.random() * 1000;
    return this.baseDelayMs * Math.pow(2, attempt) + jitter;
  }

  _sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async _executeShadow(traceId, shadowFn, primaryResult) {
    try {
      const startTime = Date.now();
      const shadowResult = await shadowFn();
      const latencyMs = Date.now() - startTime;

      const comparison = this._compareResults(primaryResult, shadowResult);

      logger.info(
        {
          traceId,
          latencyMs,
          match: comparison.match,
          similarity: comparison.similarity,
        },
        'Shadow deployment executed'
      );

      this.shadowDeployments.set(traceId, {
        primaryResult,
        shadowResult,
        comparison,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        {
          traceId,
          error: error.message,
        },
        'Shadow deployment failed'
      );
    }
  }

  _compareResults(primary, shadow) {
    if (typeof primary !== typeof shadow) {
      return { match: false, similarity: 0 };
    }

    if (typeof primary === 'object') {
      const primaryStr = JSON.stringify(primary);
      const shadowStr = JSON.stringify(shadow);
      return {
        match: primaryStr === shadowStr,
        similarity: this._calculateStringSimilarity(primaryStr, shadowStr),
      };
    }

    return {
      match: primary === shadow,
      similarity: primary === shadow ? 1.0 : 0.0,
    };
  }

  _calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const commonChars = this._countCommonChars(shorter, longer);
    return commonChars / longer.length;
  }

  _countCommonChars(str1, str2) {
    let count = 0;
    for (let i = 0; i < str1.length; i++) {
      if (str2.includes(str1[i])) {
        count++;
      }
    }
    return count;
  }

  clearCache() {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  getShadowDeploymentResults() {
    return Array.from(this.shadowDeployments.values());
  }
}

export const reliabilityLayer = new AIReliabilityLayer();
