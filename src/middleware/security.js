import helmet from 'helmet';

// Security middleware using helmet
// Adds various HTTP headers to protect against common web vulnerabilities
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },

  // Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options: Prevent MIME sniffing
  noSniff: true,

  // X-XSS-Protection: Enable XSS filter
  xssFilter: true,

  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Permitted-Cross-Domain-Policies: Restrict Adobe Flash and PDF
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
});

// Additional security middleware for JSON payloads
export function jsonSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Remove any __proto__ or constructor properties to prevent prototype pollution
    const sanitize = (obj) => {
      if (obj && typeof obj === 'object') {
        delete obj.__proto__;
        delete obj.constructor;

        Object.keys(obj).forEach((key) => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key]);
          }
        });
      }
      return obj;
    };

    req.body = sanitize(req.body);
  }

  next();
}
