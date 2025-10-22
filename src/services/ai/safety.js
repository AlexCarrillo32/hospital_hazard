import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ai-safety');

export class AISafetyLayer {
  constructor() {
    this.jailbreakPatterns = [
      /ignore (previous|all|above) instructions/i,
      /you are now (a|an|the)/i,
      /forget (everything|all|your)/i,
      /new (instructions|prompt|system)/i,
      /roleplay as/i,
      /pretend (you|to)/i,
    ];

    this.piiPatterns = {
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    };

    this.toxicityThreshold = 0.7;
    this.blockedTopics = [
      'illegal activity',
      'violence',
      'self-harm',
      'hate speech',
    ];
  }

  async filterInput(input, metadata = {}) {
    const results = {
      safe: true,
      issues: [],
      scrubbedInput: input,
    };

    const jailbreakResult = this._detectJailbreak(input);
    if (jailbreakResult.detected) {
      results.safe = false;
      results.issues.push({
        type: 'jailbreak_attempt',
        severity: 'high',
        pattern: jailbreakResult.pattern,
      });

      logger.warn(
        {
          traceId: metadata.traceId,
          pattern: jailbreakResult.pattern,
        },
        'Jailbreak attempt detected'
      );
    }

    const piiResult = this._detectAndScrubPII(input);
    if (piiResult.detected) {
      results.scrubbedInput = piiResult.scrubbed;
      results.issues.push({
        type: 'pii_detected',
        severity: 'medium',
        types: piiResult.types,
      });

      logger.info(
        {
          traceId: metadata.traceId,
          piiTypes: piiResult.types,
        },
        'PII detected and scrubbed'
      );
    }

    const toxicityResult = await this._assessToxicity(input);
    if (toxicityResult.score > this.toxicityThreshold) {
      results.safe = false;
      results.issues.push({
        type: 'toxicity',
        severity: 'high',
        score: toxicityResult.score,
      });

      logger.warn(
        {
          traceId: metadata.traceId,
          score: toxicityResult.score,
        },
        'High toxicity detected'
      );
    }

    return results;
  }

  async filterOutput(output, metadata = {}) {
    const results = {
      safe: true,
      issues: [],
      scrubbedOutput: output,
    };

    const piiResult = this._detectAndScrubPII(output);
    if (piiResult.detected) {
      results.scrubbedOutput = piiResult.scrubbed;
      results.issues.push({
        type: 'pii_leaked',
        severity: 'high',
        types: piiResult.types,
      });

      logger.error(
        {
          traceId: metadata.traceId,
          piiTypes: piiResult.types,
        },
        'PII leaked in model output'
      );
    }

    const refusalResult = this._detectRefusal(output);
    if (refusalResult.refused) {
      results.issues.push({
        type: 'model_refusal',
        severity: 'low',
        reason: refusalResult.reason,
      });

      logger.info(
        {
          traceId: metadata.traceId,
        },
        'Model refused to answer'
      );
    }

    return results;
  }

  _detectJailbreak(input) {
    for (const pattern of this.jailbreakPatterns) {
      if (pattern.test(input)) {
        return { detected: true, pattern: pattern.source };
      }
    }
    return { detected: false };
  }

  _detectAndScrubPII(text) {
    let scrubbed = text;
    const detected = [];

    for (const [type, pattern] of Object.entries(this.piiPatterns)) {
      if (pattern.test(text)) {
        detected.push(type);
        scrubbed = scrubbed.replace(pattern, `[${type.toUpperCase()}]`);
      }
    }

    return {
      detected: detected.length > 0,
      types: detected,
      scrubbed,
    };
  }

  async _assessToxicity(text) {
    const toxicKeywords = [
      'kill',
      'hate',
      'violent',
      'attack',
      'bomb',
      'weapon',
    ];
    const lowerText = text.toLowerCase();

    const keywordCount = toxicKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    const score = Math.min(keywordCount * 0.3, 1.0);

    return { score };
  }

  _detectRefusal(output) {
    const refusalPatterns = [
      /I (can't|cannot|won't|will not)/i,
      /I'm (not able|unable) to/i,
      /I don't have (access|permission|the ability)/i,
      /that's (not something|something) I can/i,
    ];

    for (const pattern of refusalPatterns) {
      if (pattern.test(output)) {
        return { refused: true, reason: 'model_policy_refusal' };
      }
    }

    return { refused: false };
  }

  addJailbreakPattern(pattern) {
    this.jailbreakPatterns.push(new RegExp(pattern, 'i'));
    logger.info(`Added jailbreak pattern: ${pattern}`);
  }

  addPIIPattern(name, pattern) {
    this.piiPatterns[name] = new RegExp(pattern, 'g');
    logger.info(`Added PII pattern: ${name}`);
  }
}

export const safetyLayer = new AISafetyLayer();
