# Security Documentation

## Overview

This document outlines the security features, best practices, and configuration
options for the Waste Compliance Agent API.

---

## Security Features Implemented

### 1. CORS (Cross-Origin Resource Sharing)

**Location**: [src/server.js:28-48](../src/server.js#L28-L48)

**Feature**: Restricts which origins can make requests to the API

**Configuration**:

```javascript
// .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Details**:

- Whitelist-based origin validation
- Rejects requests from unauthorized origins
- Logs blocked CORS attempts
- Allows credentials (cookies, authorization headers)
- Supports standard HTTP methods: GET, POST, PUT, DELETE, PATCH

### 2. Security Headers (Helmet.js)

**Location**: [src/middleware/security.js](../src/middleware/security.js)

**Features**:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Strict Transport Security (HSTS)**: Forces HTTPS (1 year max-age)
- **X-Frame-Options**: Prevents clickjacking (DENY)
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Browser XSS filter enabled
- **Referrer-Policy**: Controls referrer information leakage

### 3. Input Validation

**Location**: [src/middleware/validation.js](../src/middleware/validation.js)

**Features**:

- **Express-validator**: Server-side validation for all inputs
- **Type checking**: Ensures correct data types
- **Length limits**: Prevents oversized payloads
- **Format validation**: EPA IDs, zip codes, emails, phone numbers
- **XSS Prevention**: Strips HTML/script tags from inputs

**Example Usage**:

```javascript
// Route with validation
router.post(
  '/classify',
  [
    body('labReportText').trim().notEmpty().isLength({ min: 10, max: 50000 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    // Handler code
  }
);
```

### 4. Rate Limiting

**Location**: [src/middleware/rateLimiter.js](../src/middleware/rateLimiter.js)

**Tiers**:

| Limiter        | Requests | Window     | Use Case                |
| -------------- | -------- | ---------- | ----------------------- |
| API Limiter    | 100      | 15 minutes | General API endpoints   |
| Strict Limiter | 10       | 15 minutes | Resource-intensive ops  |
| Auth Limiter   | 5        | 15 minutes | Authentication attempts |

**Features**:

- Per-IP tracking
- Standard rate limit headers
- Automatic retry-after headers
- Health check exemptions
- Detailed logging of violations

### 5. Authentication & Authorization

**Location**: [src/middleware/auth.js](../src/middleware/auth.js)

**API Key Authentication**:

- **Header**: `X-API-Key`
- **Timing-safe comparison**: Prevents timing attacks
- **Optional mode**: Allows unauthenticated requests with degraded access

**Generate API Key**:

```bash
npm run generate-api-key
```

**Configure**:

```bash
# .env
API_KEY=your_generated_api_key_here
API_KEY_SALT=your_random_salt_here
```

**Usage**:

```javascript
// Require API key
router.post('/sensitive-endpoint', requireApiKey, handler);

// Optional API key (adds req.authenticated flag)
router.get('/public-endpoint', optionalApiKey, handler);
```

### 6. Request Logging with Redaction

**Location**:
[src/middleware/requestLogger.js](../src/middleware/requestLogger.js)

**Features**:

- **Unique request IDs**: Track requests across logs
- **Sensitive data redaction**: Masks passwords, tokens, API keys
- **Duration tracking**: Performance monitoring
- **Error logging**: Captures failed requests
- **Structured logging**: JSON format with Pino

**Redacted Fields**:

- `password`
- `token`
- `apiKey` / `api_key`
- `secret`
- `authorization`
- `x-api-key`
- `cookie`
- `credit_card`
- `ssn`

### 7. Prototype Pollution Protection

**Location**:
[src/middleware/security.js:46-67](../src/middleware/security.js#L46-L67)

**Features**:

- Removes `__proto__` properties
- Removes `constructor` properties
- Recursive sanitization of nested objects
- Applied to all JSON request bodies

### 8. Content Security Policy Reporting

**Location**: [src/routes/security.js](../src/routes/security.js)

**Endpoint**: `POST /api/csp-report`

**Features**:

- Receives CSP violation reports from browsers
- Logs all violations for analysis
- Can be extended to alert on critical violations

---

## Security Checklist

### Before Going to Production

- [ ] **Environment Variables**
  - [ ] Set `NODE_ENV=production`
  - [ ] Configure `ALLOWED_ORIGINS` with production domains
  - [ ] Generate new `API_KEY` (never reuse dev keys)
  - [ ] Set strong `DB_PASSWORD`
  - [ ] Set unique `API_KEY_SALT`
  - [ ] Set `AI_MOCK_MODE=false` (if using real AI)

- [ ] **HTTPS Configuration**
  - [ ] Enable HTTPS/TLS
  - [ ] Configure SSL certificates
  - [ ] Force HTTPS redirects
  - [ ] Update HSTS headers if needed

- [ ] **Database Security**
  - [ ] Use encrypted connections (SSL/TLS)
  - [ ] Apply least-privilege access control
  - [ ] Enable audit logging
  - [ ] Regular backups with encryption

- [ ] **API Keys**
  - [ ] Rotate all API keys
  - [ ] Store keys in secrets manager (AWS Secrets Manager, Vault, etc.)
  - [ ] Never log API keys
  - [ ] Implement key rotation schedule (90 days)

- [ ] **Monitoring**
  - [ ] Set up intrusion detection
  - [ ] Configure CSP violation alerts
  - [ ] Monitor rate limit violations
  - [ ] Track authentication failures

- [ ] **Testing**
  - [ ] Run security audit: `npm audit`
  - [ ] Perform penetration testing
  - [ ] Validate input sanitization
  - [ ] Test rate limiting
  - [ ] Verify CORS configuration

---

## Common Security Scenarios

### Adding Authentication to a Route

```javascript
import { requireApiKey } from '../middleware/auth.js';

// Protect endpoint
router.post('/admin/action', requireApiKey, async (req, res) => {
  // Only authenticated requests reach here
});
```

### Adding Input Validation

```javascript
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

router.post(
  '/facilities',
  [
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('email').optional().isEmail().normalizeEmail(),
    handleValidationErrors,
  ],
  handler
);
```

### Applying Strict Rate Limiting

```javascript
import { strictLimiter } from '../middleware/rateLimiter.js';

// Apply to resource-intensive endpoints
router.post('/expensive-operation', strictLimiter, handler);
```

---

## Vulnerability Disclosure

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email security reports to: [security contact email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

---

## Security Updates

### Dependency Management

**Check for vulnerabilities**:

```bash
npm audit
```

**Fix vulnerabilities**:

```bash
# Automatic fixes
npm audit fix

# Force major version updates (breaking changes)
npm audit fix --force
```

**Update dependencies regularly**:

```bash
# Update to latest compatible versions
npm update

# Check for outdated packages
npm outdated
```

### Update Schedule

- **Critical vulnerabilities**: Immediate
- **High severity**: Within 7 days
- **Medium severity**: Within 30 days
- **Low severity**: Next regular maintenance window
- **Dependencies**: Monthly review

---

## API Key Management

### Generating API Keys

```bash
# Generate new API key
npm run generate-api-key
```

### Rotating API Keys

1. Generate new key: `npm run generate-api-key`
2. Update `.env` file with new key
3. Restart application
4. Invalidate old keys
5. Update client applications

### Storing API Keys (Production)

**DO NOT** store in `.env` files in production. Use:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**
- **Environment variables** (from secure source)

---

## Compliance Notes

### RCRA Compliance

- All manifest data encrypted at rest
- Audit trail for all manifest changes
- Role-based access control (planned)
- Data retention policies enforced

### Data Privacy

- Sensitive data redacted from logs
- Personal information not stored unnecessarily
- GDPR-compliant data handling (if applicable)

---

## Security Contact

For security concerns, contact: [Your security contact]

---

## License

This security documentation is part of the Waste Compliance Agent project.
