/**
 * Custom error classes for AI service operations
 */

export class AIServiceError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AIServiceError';
    this.code = options.code || 'AI_ERROR';
    this.statusCode = options.statusCode || 500;
    this.retryable = options.retryable || false;
    this.details = options.details || {};
  }
}

export class RateLimitError extends AIServiceError {
  constructor(message, retryAfter) {
    super(message, {
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      retryable: true,
      details: { retryAfter },
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends AIServiceError {
  constructor(message) {
    super(message, {
      code: 'AUTHENTICATION_FAILED',
      statusCode: 401,
      retryable: false,
    });
    this.name = 'AuthenticationError';
  }
}

export class InvalidRequestError extends AIServiceError {
  constructor(message, details) {
    super(message, {
      code: 'INVALID_REQUEST',
      statusCode: 400,
      retryable: false,
      details,
    });
    this.name = 'InvalidRequestError';
  }
}

export class ModelOverloadedError extends AIServiceError {
  constructor(message) {
    super(message, {
      code: 'MODEL_OVERLOADED',
      statusCode: 529,
      retryable: true,
    });
    this.name = 'ModelOverloadedError';
  }
}

export class TimeoutError extends AIServiceError {
  constructor(message, timeoutMs) {
    super(message, {
      code: 'REQUEST_TIMEOUT',
      statusCode: 408,
      retryable: true,
      details: { timeoutMs },
    });
    this.name = 'TimeoutError';
  }
}

export class SafetyViolationError extends AIServiceError {
  constructor(message, issues) {
    super(message, {
      code: 'SAFETY_VIOLATION',
      statusCode: 400,
      retryable: false,
      details: { issues },
    });
    this.name = 'SafetyViolationError';
  }
}

/**
 * Parse API error response and return appropriate error
 */
export function parseAPIError(response, responseText) {
  const status = response.status;

  // Rate limiting
  if (status === 429) {
    const retryAfter = response.headers.get('retry-after') || '60';
    return new RateLimitError(
      'Rate limit exceeded. Please try again later.',
      parseInt(retryAfter, 10)
    );
  }

  // Authentication
  if (status === 401) {
    return new AuthenticationError('Invalid API key or authentication failed.');
  }

  // Bad request
  if (status === 400) {
    let details = {};
    try {
      details = JSON.parse(responseText);
    } catch {
      details = { message: responseText };
    }
    return new InvalidRequestError('Invalid request to AI service.', details);
  }

  // Model overloaded
  if (status === 529) {
    return new ModelOverloadedError('AI service is temporarily overloaded. Please try again.');
  }

  // Server errors
  if (status >= 500) {
    return new AIServiceError('AI service encountered an internal error.', {
      code: 'SERVER_ERROR',
      statusCode: status,
      retryable: true,
      details: { responseText },
    });
  }

  // Generic error
  return new AIServiceError(`AI service error: ${status}`, {
    statusCode: status,
    details: { responseText },
  });
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error) {
  if (error instanceof AIServiceError) {
    return error.retryable;
  }

  // Network errors are generally retryable
  if (error.name === 'AbortError' || error.name === 'TypeError') {
    return true;
  }

  return false;
}
