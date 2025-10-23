import { createLogger } from '../../utils/logger.js';
import { instrumentation } from './instrumentation.js';
import { safetyLayer } from './safety.js';
import { reliabilityLayer } from './reliability.js';

const logger = createLogger('claude-client');

export class ClaudeClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.AI_MODEL_API_KEY;
    this.endpoint =
      config.endpoint || process.env.AI_MODEL_ENDPOINT || 'https://api.anthropic.com/v1';
    this.model = config.model || process.env.AI_MODEL_NAME || 'claude-3-5-sonnet-20241022';
    this.timeout = config.timeout || parseInt(process.env.AI_MODEL_TIMEOUT || '60000');
    this.mockMode = config.mockMode || process.env.AI_MOCK_MODE === 'true';

    if (!this.apiKey && !this.mockMode) {
      throw new Error('AI_MODEL_API_KEY is required (or set AI_MOCK_MODE=true for testing)');
    }
  }

  async generateCompletion(prompt, options = {}) {
    const {
      traceId = `trace-${Date.now()}`,
      temperature = 0.3,
      maxTokens = 4096,
      systemPrompt = null,
      enableCache = true,
      enableSafety = true,
    } = options;

    if (enableSafety) {
      const inputCheck = await safetyLayer.filterInput(prompt, { traceId });
      if (!inputCheck.safe) {
        const error = new Error('Input rejected by safety layer');
        error.safetyIssues = inputCheck.issues;
        throw error;
      }
      prompt = inputCheck.scrubbedInput;
    }

    const completionFn = async () => {
      instrumentation.logPrompt(traceId, prompt, {
        model: this.model,
        temperature,
        maxTokens,
        systemPrompt,
        mockMode: this.mockMode,
      });

      const startTime = Date.now();

      // Mock mode for testing without API key
      if (this.mockMode) {
        logger.info({ traceId }, 'Running in MOCK mode');
        const mockResponse = this._generateMockResponse(prompt, systemPrompt);
        const latencyMs = Date.now() - startTime + Math.random() * 1000;

        instrumentation.logOutput(traceId, mockResponse, {
          model: this.model,
          tokensUsed: Math.floor(prompt.length / 4) + Math.floor(mockResponse.length / 4),
          latencyMs,
          mockMode: true,
        });

        return mockResponse;
      }

      const requestBody = {
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const response = await fetch(`${this.endpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const outputText = data.content[0].text;
      const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

      instrumentation.logOutput(traceId, outputText, {
        model: this.model,
        tokensUsed,
        latencyMs,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      });

      if (enableSafety) {
        const outputCheck = await safetyLayer.filterOutput(outputText, {
          traceId,
        });
        if (outputCheck.issues.some((i) => i.type === 'pii_leaked')) {
          logger.error({ traceId, issues: outputCheck.issues }, 'PII leaked in output');
        }
        return outputCheck.scrubbedOutput;
      }

      return outputText;
    };

    const cacheKey = enableCache
      ? `claude-${Buffer.from(prompt).toString('base64').slice(0, 32)}`
      : null;

    const { result } = await reliabilityLayer.executeWithReliability(completionFn, {
      traceId,
      cacheKey,
      cacheTtlMs: 3600000,
      enableCache,
      enableRetry: true,
    });

    return result;
  }

  async generateStructuredOutput(prompt, schema, options = {}) {
    const systemPrompt =
      options.systemPrompt ||
      'You are a precise data extraction system. Return ONLY valid JSON matching the schema. Do not include any explanatory text.';

    const fullPrompt = `${prompt}\n\nReturn your response as JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`;

    const response = await this.generateCompletion(fullPrompt, {
      ...options,
      systemPrompt,
      temperature: 0.1,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error({ error: error.message, response }, 'Failed to parse structured output');
      throw new Error('Invalid JSON response from model');
    }
  }

  _generateMockResponse(prompt, systemPrompt) {
    // Generate realistic mock responses for testing
    const lowerPrompt = prompt.toLowerCase();

    // Waste classification mock
    if (lowerPrompt.includes('acetone') || lowerPrompt.includes('flash point')) {
      return JSON.stringify({
        wasteCode: 'D001',
        category: 'ignitable',
        confidence: 0.92,
        reasoning:
          'Waste contains acetone with flash point of 0°F, well below EPA threshold of 140°F for ignitable wastes.',
        chemicalsDetected: ['Acetone', 'Isopropyl Alcohol'],
        physicalProperties: {
          flashPoint: 0,
          pH: 7.2,
          physicalState: 'liquid',
        },
        recommendedHandling:
          'Store in approved flammable storage cabinet. Dispose at EPA-certified facility.',
      });
    }

    // Waste profile generation mock
    if (lowerPrompt.includes('waste profile') || systemPrompt?.includes('EPA waste profile')) {
      return `EPA HAZARDOUS WASTE PROFILE DOCUMENT

WASTE IDENTIFICATION
Waste Code: D001 - Ignitable Waste
Category: Ignitable
Physical State: Liquid

HAZARD CHARACTERISTICS
- Flash Point: 0°F (-18°C)
- Highly flammable
- Incompatible with strong oxidizers

CHEMICAL COMPOSITION
- Acetone: 85% by volume
- Isopropyl Alcohol: 10% by volume
- Water: 5% by volume

GENERATOR INFORMATION
[To be completed by generator]

TREATMENT/DISPOSAL RECOMMENDATIONS
Dispose at EPA-approved hazardous waste facility with incineration or chemical treatment capabilities.

EMERGENCY RESPONSE PROCEDURES
In case of spill: Eliminate ignition sources. Use appropriate absorbent materials. Contact emergency services if necessary.

This profile complies with EPA RCRA regulations for hazardous waste management.`;
    }

    // Generic response
    return 'Mock response generated for testing purposes.';
  }
}

export const defaultClaudeClient = new ClaudeClient({ mockMode: true });
