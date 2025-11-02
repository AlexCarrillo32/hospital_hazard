# Production Security Checklist

Complete security checklist for deploying the Waste Compliance Agent to
production.

**Status Key**: ✅ Complete | ⏳ In Progress | ❌ Not Started

---

## 1. SSL/TLS Configuration

- [ ] Obtain valid SSL certificate from trusted CA (Let's Encrypt or commercial)
- [ ] Configure certificate paths in production `.env`
- [ ] Set `SSL_ENABLED=true`
- [ ] Enable HTTP to HTTPS redirect (`HTTP_REDIRECT=true`)
- [ ] Test SSL configuration with SSL Labs (target: A+ rating)
- [ ] Verify certificate auto-renewal is configured
- [ ] Set up certificate expiration monitoring/alerts
- [ ] Test HTTPS from multiple browsers
- [ ] Verify HSTS headers are present
- [ ] Check for mixed content warnings

**Verify**:

```bash
# Test SSL certificate
npm run pentest

# Manual test
curl -I https://yourdomain.com
```

---

## 2. Environment Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Configure production `ALLOWED_ORIGINS` (no wildcards)
- [ ] Generate strong `API_KEY` for production
- [ ] Generate unique `API_KEY_SALT`
- [ ] Set strong `DB_PASSWORD` (min 20 chars, complex)
- [ ] Set `AI_MOCK_MODE=false` (if using real AI)
- [ ] Remove all development/test credentials
- [ ] Verify `.env` file is in `.gitignore`
- [ ] Use secrets manager (AWS Secrets Manager, Vault, etc.)
- [ ] Remove all default/example values

**Verify**:

```bash
# Check environment validation
node -e "import('./src/config/env.js')"
```

---

## 3. Database Security

- [ ] Use encrypted database connections (SSL/TLS)
- [ ] Apply least-privilege database user permissions
- [ ] Enable database audit logging
- [ ] Set up regular encrypted backups
- [ ] Verify no default credentials in use
- [ ] Enable database firewall rules (restrict IP access)
- [ ] Use prepared statements (already done with Knex)
- [ ] Run migrations on production database
- [ ] Test database connection security
- [ ] Configure connection pooling limits

**Verify**:

```bash
# Test database connection
npm run db:test
```

---

## 4. API Security

- [ ] API key authentication enabled on all sensitive endpoints
- [ ] Rate limiting configured and tested
- [ ] CORS whitelist configured (no `*` wildcard)
- [ ] Input validation on all endpoints
- [ ] XSS protection enabled and tested
- [ ] SQL injection protection tested
- [ ] Request size limits configured (10MB)
- [ ] Security headers enabled (Helmet)
- [ ] CSP policy configured
- [ ] Prototype pollution protection enabled

**Verify**:

```bash
# Run penetration tests
npm run pentest

# Check rate limiting
ab -n 200 -c 10 https://yourdomain.com/api/health
```

---

## 5. Authentication & Authorization

- [ ] Strong API keys generated (32+ bytes)
- [ ] API keys stored securely (hashed if in database)
- [ ] Timing-safe comparison for API keys (already implemented)
- [ ] Failed authentication attempts logged
- [ ] Rate limiting on auth endpoints
- [ ] No credentials in logs (redaction enabled)
- [ ] Consider implementing JWT for user sessions (future)
- [ ] Consider implementing OAuth2 (future)
- [ ] Role-based access control planned/implemented

**Verify**:

```bash
# Test authentication
curl -H "X-API-Key: invalid" https://yourdomain.com/api/health
```

---

## 6. Logging & Monitoring

- [ ] Production logging configured (info level or higher)
- [ ] Sensitive data redaction enabled
- [ ] Log rotation configured
- [ ] Centralized log management (optional: ELK, Datadog, etc.)
- [ ] Security monitoring script running
- [ ] Alert thresholds configured
- [ ] Failed auth attempt alerts
- [ ] Rate limit violation alerts
- [ ] CORS violation alerts
- [ ] CSP violation monitoring
- [ ] Error tracking (Sentry, Rollbar, etc.)

**Verify**:

```bash
# Start security monitoring
npm run security-monitor &

# Check logs
tail -f logs/app.log
```

---

## 7. Dependency Security

- [ ] Run `npm audit` and address all vulnerabilities
- [ ] Update dependencies to latest secure versions
- [ ] Remove unused dependencies
- [ ] Use lock file (`package-lock.json`)
- [ ] Configure automated security updates (Dependabot, Snyk)
- [ ] Verify no known vulnerabilities in production dependencies
- [ ] Set up vulnerability alerts

**Verify**:

```bash
# Check for vulnerabilities
npm audit

# Check outdated packages
npm outdated
```

---

## 8. Infrastructure Security

- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key-based authentication (disable password login)
- [ ] Non-root user running application
- [ ] Automatic security updates enabled
- [ ] Intrusion detection system configured (fail2ban, etc.)
- [ ] DDoS protection (Cloudflare, AWS Shield, etc.)
- [ ] Regular security patches applied
- [ ] Server hardening completed
- [ ] Disable unnecessary services
- [ ] Configure process manager (PM2, systemd)

**Verify**:

```bash
# Check open ports
sudo netstat -tulpn | grep LISTEN

# Check running processes
ps aux | grep node
```

---

## 9. Application Security

- [ ] All routes have proper authentication
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] CSRF protection (if applicable)
- [ ] File upload restrictions (if applicable)
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces disabled in production
- [ ] Source maps disabled or protected
- [ ] Debug mode disabled
- [ ] Test all security middleware

**Verify**:

```bash
# Check error handling
curl https://yourdomain.com/nonexistent

# Verify no stack traces in response
```

---

## 10. Data Protection

- [ ] Data encryption at rest (database)
- [ ] Data encryption in transit (HTTPS)
- [ ] Backup encryption enabled
- [ ] Data retention policies implemented
- [ ] PII handling compliant (GDPR, CCPA if applicable)
- [ ] Secure file storage configured
- [ ] Data access logging enabled
- [ ] Regular security audits scheduled

---

## 11. Compliance & Documentation

- [ ] Security documentation up to date
- [ ] API documentation includes security requirements
- [ ] Incident response plan documented
- [ ] Security contact information published
- [ ] Vulnerability disclosure policy published
- [ ] Terms of Service & Privacy Policy (if applicable)
- [ ] Compliance requirements met (RCRA, EPA, etc.)
- [ ] Security training for team members

---

## 12. Testing & Validation

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security penetration tests run
- [ ] Load testing completed
- [ ] SSL/TLS configuration tested
- [ ] Backup restoration tested
- [ ] Failover testing completed
- [ ] Security headers validated
- [ ] Third-party security audit (optional but recommended)

**Verify**:

```bash
# Run all tests
npm test

# Run penetration tests
npm run pentest

# Load test
ab -n 10000 -c 100 https://yourdomain.com/health
```

---

## 13. Deployment Security

- [ ] Use CI/CD pipeline with security scanning
- [ ] Secrets not in version control
- [ ] Environment-specific configurations
- [ ] Blue-green or canary deployment strategy
- [ ] Rollback plan documented and tested
- [ ] Health check endpoints configured
- [ ] Graceful shutdown handling
- [ ] Zero-downtime deployment tested

---

## 14. Post-Deployment

- [ ] Verify application accessible over HTTPS
- [ ] Test all critical user flows
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Review security logs
- [ ] Test incident response procedures
- [ ] Schedule regular security reviews (quarterly)
- [ ] Plan penetration testing (annual)

---

## Quick Reference Commands

```bash
# Generate API key
npm run generate-api-key

# Setup SSL (development)
npm run setup-ssl-dev

# Run security penetration tests
npm run pentest

# Start security monitoring
npm run security-monitor

# Check dependencies
npm audit

# Run all tests
npm test

# Check environment config
node -e "import('./src/config/env.js')"
```

---

## Security Incident Response

If a security incident occurs:

1. **Immediate Actions**:
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team
   - Assess scope of breach

2. **Investigation**:
   - Review security logs
   - Identify attack vector
   - Determine data exposure
   - Document timeline

3. **Remediation**:
   - Patch vulnerabilities
   - Rotate all credentials
   - Update security controls
   - Deploy fixes

4. **Post-Incident**:
   - Notify affected parties (if required)
   - Update security procedures
   - Conduct post-mortem
   - Implement preventive measures

---

## Security Contacts

- **Security Team**: [security@example.com]
- **On-Call**: [oncall@example.com]
- **Vulnerability Reports**: [security-reports@example.com]

---

## Review Schedule

- **Daily**: Security logs, monitoring alerts
- **Weekly**: Failed authentication attempts, rate limit violations
- **Monthly**: Dependency updates, certificate expiration checks
- **Quarterly**: Full security audit, penetration testing
- **Annually**: Third-party security assessment

---

## Compliance Matrix

| Requirement       | Status | Evidence                     |
| ----------------- | ------ | ---------------------------- |
| RCRA Compliance   | ⏳     | Manifest encryption, audits  |
| Data Encryption   | ✅     | SSL/TLS, database encryption |
| Access Control    | ✅     | API key authentication       |
| Audit Logging     | ✅     | All requests logged          |
| Incident Response | ⏳     | Plan documented              |
| Regular Audits    | ❌     | Schedule quarterly reviews   |

---

## Sign-Off

- [ ] **Security Team Lead**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date:
      \_\_\_\_\_\_\_\_
- [ ] **DevOps Lead**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- [ ] **CTO/Technical Lead**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date:
      \_\_\_\_\_\_\_\_

---

**Last Updated**: 2025-01-25 **Next Review**: 2025-04-25
