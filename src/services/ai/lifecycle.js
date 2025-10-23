import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ai-lifecycle');

export class AILifecycleManager {
  constructor() {
    this.driftDetectors = new Map();
    this.retrainingTriggers = new Map();
    this.baselineMetrics = new Map();
  }

  registerDriftDetector(name, config = {}) {
    const { metricName, windowSize = 1000, threshold = 0.1, checkIntervalMs = 60000 } = config;

    this.driftDetectors.set(name, {
      metricName,
      windowSize,
      threshold,
      checkIntervalMs,
      recentSamples: [],
      baseline: null,
      lastCheck: Date.now(),
    });

    logger.info(`Registered drift detector: ${name}`);
  }

  recordMetric(detectorName, value, metadata = {}) {
    const detector = this.driftDetectors.get(detectorName);
    if (!detector) {
      return;
    }

    detector.recentSamples.push({
      value,
      timestamp: Date.now(),
      metadata,
    });

    if (detector.recentSamples.length > detector.windowSize) {
      detector.recentSamples.shift();
    }

    if (!detector.baseline && detector.recentSamples.length >= 100) {
      detector.baseline = this._calculateBaseline(detector.recentSamples);
      logger.info(
        {
          detector: detectorName,
          baseline: detector.baseline,
        },
        'Baseline established'
      );
    }

    if (Date.now() - detector.lastCheck > detector.checkIntervalMs) {
      this._checkForDrift(detectorName);
      detector.lastCheck = Date.now();
    }
  }

  registerRetrainingTrigger(name, condition) {
    this.retrainingTriggers.set(name, {
      condition,
      triggered: false,
      triggeredAt: null,
      triggeredCount: 0,
    });

    logger.info(`Registered retraining trigger: ${name}`);
  }

  checkRetrainingTriggers() {
    const triggered = [];

    for (const [name, trigger] of this.retrainingTriggers.entries()) {
      if (trigger.condition()) {
        trigger.triggered = true;
        trigger.triggeredAt = new Date().toISOString();
        trigger.triggeredCount += 1;

        triggered.push(name);

        logger.warn(
          {
            trigger: name,
            count: trigger.triggeredCount,
          },
          'Retraining trigger activated'
        );
      }
    }

    return triggered;
  }

  _checkForDrift(detectorName) {
    const detector = this.driftDetectors.get(detectorName);
    if (!detector || !detector.baseline) {
      return null;
    }

    const currentMetrics = this._calculateBaseline(detector.recentSamples);
    const driftScore = this._calculateDrift(detector.baseline, currentMetrics);

    if (driftScore > detector.threshold) {
      logger.warn(
        {
          detector: detectorName,
          driftScore,
          threshold: detector.threshold,
          baseline: detector.baseline,
          current: currentMetrics,
        },
        'Model drift detected'
      );

      this.registerRetrainingTrigger(
        `drift_${detectorName}`,
        () => driftScore > detector.threshold
      );
    } else {
      logger.info(
        {
          detector: detectorName,
          driftScore,
        },
        'No significant drift detected'
      );
    }

    return driftScore;
  }

  _calculateBaseline(samples) {
    const values = samples.map((s) => s.value);

    return {
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: this._calculateMedian(values),
      stdDev: this._calculateStdDev(values),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  _calculateDrift(baseline, current) {
    const meanDrift = Math.abs(baseline.mean - current.mean) / baseline.mean;
    const stdDevDrift = Math.abs(baseline.stdDev - current.stdDev) / baseline.stdDev;

    return (meanDrift + stdDevDrift) / 2;
  }

  _calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  _calculateStdDev(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(variance);
  }

  getDriftReport() {
    const report = [];

    for (const [name, detector] of this.driftDetectors.entries()) {
      if (!detector.baseline) {
        continue;
      }

      const currentMetrics = this._calculateBaseline(detector.recentSamples);
      const driftScore = this._calculateDrift(detector.baseline, currentMetrics);

      report.push({
        detector: name,
        driftScore,
        threshold: detector.threshold,
        driftDetected: driftScore > detector.threshold,
        baseline: detector.baseline,
        current: currentMetrics,
        sampleCount: detector.recentSamples.length,
      });
    }

    return report;
  }

  getRetrainingStatus() {
    const status = [];

    for (const [name, trigger] of this.retrainingTriggers.entries()) {
      status.push({
        trigger: name,
        triggered: trigger.triggered,
        triggeredAt: trigger.triggeredAt,
        triggeredCount: trigger.triggeredCount,
      });
    }

    return status;
  }

  resetTrigger(triggerName) {
    const trigger = this.retrainingTriggers.get(triggerName);
    if (trigger) {
      trigger.triggered = false;
      trigger.triggeredAt = null;
      logger.info(`Reset retraining trigger: ${triggerName}`);
    }
  }
}

export const lifecycleManager = new AILifecycleManager();
