# SSL/TLS Setup Guide

Complete guide for setting up HTTPS/TLS certificates for the Waste Compliance
Agent.

---

## Table of Contents

1. [Development Setup (Self-Signed)](#development-setup)
2. [Production Setup (Let's Encrypt)](#production-setup-lets-encrypt)
3. [Production Setup (Commercial CA)](#production-setup-commercial-ca)
4. [Certificate Management](#certificate-management)
5. [Troubleshooting](#troubleshooting)

---

## Development Setup

### Quick Start (Self-Signed Certificates)

**⚠️ WARNING**: Self-signed certificates are for DEVELOPMENT ONLY. Never use in
production!

```bash
# Generate self-signed certificates
npm run setup-ssl-dev

# Update .env file
SSL_ENABLED=true
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem

# Start server
npm start
```

Access your app at: `https://localhost:3000`

**Browser Warning**: Your browser will show a security warning. This is expected
for self-signed certificates.

- **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "Visit this website"

---

## Production Setup (Let's Encrypt)

Let's Encrypt provides FREE, automated SSL certificates trusted by all browsers.

### Prerequisites

- Domain name pointing to your server
- Port 80 open (for HTTP-01 challenge)
- Root/sudo access to server

### Method 1: Using Certbot (Recommended)

#### Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# CentOS/RHEL
sudo yum install certbot

# macOS
brew install certbot
```

#### Generate Certificates

```bash
# Stop your application first (port 80 must be free)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Configure Application

```bash
# .env
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Enable HTTP to HTTPS redirect
HTTP_REDIRECT=true
HTTP_PORT=80
```

#### Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab (runs twice daily)
sudo crontab -e

# Add this line:
0 0,12 * * * certbot renew --quiet --post-hook "systemctl restart your-app"
```

### Method 2: Using Nginx Reverse Proxy

Many prefer using Nginx to handle SSL termination:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Setup (Commercial CA)

For commercial SSL certificates (DigiCert, GlobalSign, Sectigo, etc.):

### Step 1: Generate CSR (Certificate Signing Request)

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout yourdomain.key \
  -out yourdomain.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=Your Company/CN=yourdomain.com"
```

### Step 2: Purchase Certificate

1. Go to your CA's website (DigiCert, GlobalSign, etc.)
2. Purchase SSL certificate
3. Submit your CSR file
4. Complete domain validation (email, DNS, or file-based)

### Step 3: Download Certificates

You'll receive:

- `yourdomain.crt` - Your certificate
- `intermediate.crt` - Intermediate certificate
- `root.crt` - Root certificate (optional)

### Step 4: Create Certificate Chain

```bash
# Combine certificates
cat yourdomain.crt intermediate.crt > fullchain.pem
```

### Step 5: Configure Application

```bash
# .env
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/fullchain.pem
SSL_KEY_PATH=/path/to/yourdomain.key

HTTP_REDIRECT=true
HTTP_PORT=80
```

---

## Certificate Management

### Check Certificate Expiration

```bash
# Check local certificate
openssl x509 -in /path/to/cert.pem -noout -enddate

# Check remote certificate
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -enddate
```

### Certificate Permissions

Certificates should have restrictive permissions:

```bash
# Set correct permissions
sudo chmod 600 /path/to/privkey.pem
sudo chmod 644 /path/to/fullchain.pem

# Set ownership (replace 'appuser' with your app's user)
sudo chown appuser:appuser /path/to/*.pem
```

### Certificate Monitoring

Set up monitoring to alert before expiration:

```javascript
// Add to your monitoring script
import { checkCertificateExpiration } from './src/config/ssl.js';

const result = checkCertificateExpiration(process.env.SSL_CERT_PATH);
if (!result.valid) {
  console.error('Certificate validation failed!');
  // Send alert
}
```

---

## Security Best Practices

### 1. Use Strong Cipher Suites

The application is configured with secure ciphers:

- ECDHE-ECDSA-AES128-GCM-SHA256
- ECDHE-RSA-AES128-GCM-SHA256
- ECDHE-ECDSA-AES256-GCM-SHA384
- ECDHE-RSA-AES256-GCM-SHA384

### 2. Disable Old TLS Versions

Only TLS 1.2 and TLS 1.3 are enabled. SSLv2, SSLv3, TLS 1.0, and TLS 1.1 are
disabled.

### 3. Enable HSTS

When SSL is enabled, HSTS headers are automatically sent:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 4. Use Certificate Transparency

Modern browsers require Certificate Transparency (CT) logs. Let's Encrypt and
most commercial CAs automatically include CT.

### 5. Test Your SSL Configuration

Use these tools to verify your SSL setup:

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html

**Target Score**: A+ on SSL Labs

---

## Troubleshooting

### Certificate Not Loading

**Error**: `Failed to load SSL certificates`

**Solution**:

1. Verify file paths are absolute or relative to project root
2. Check file permissions (readable by app user)
3. Verify certificate format (PEM)

```bash
# Check certificate format
openssl x509 -in cert.pem -text -noout

# Check private key format
openssl rsa -in key.pem -check
```

### Certificate/Key Mismatch

**Error**: `Private key does not match certificate`

**Solution**:

```bash
# Verify certificate and key match
openssl x509 -noout -modulus -in cert.pem | openssl md5
openssl rsa -noout -modulus -in key.pem | openssl md5

# The MD5 hashes should match
```

### Browser Shows "Not Secure"

**Causes**:

1. Self-signed certificate (expected in development)
2. Expired certificate
3. Incorrect certificate chain
4. Domain mismatch

**Solution**:

```bash
# Check certificate details
openssl x509 -in cert.pem -text -noout | grep -A 2 "Subject:"
openssl x509 -in cert.pem -text -noout | grep -A 2 "Validity"
```

### Port 443 Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:

```bash
# Find process using port 443
sudo lsof -i :443

# Kill the process
sudo kill -9 <PID>

# Or use a different port
PORT=8443
```

---

## Production Deployment Checklist

- [ ] Obtain valid SSL certificate from trusted CA
- [ ] Configure certificate paths in `.env`
- [ ] Set `SSL_ENABLED=true`
- [ ] Enable HTTP to HTTPS redirect
- [ ] Test certificate with SSL Labs
- [ ] Set up auto-renewal (Let's Encrypt)
- [ ] Configure monitoring for certificate expiration
- [ ] Update firewall rules (allow port 443)
- [ ] Update DNS records (if needed)
- [ ] Test from multiple devices/browsers
- [ ] Set up certificate backup

---

## Additional Resources

- **Let's Encrypt**: https://letsencrypt.org/getting-started/
- **Certbot**: https://certbot.eff.org/
- **SSL Labs Best Practices**:
  https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices
- **Node.js HTTPS Module**: https://nodejs.org/api/https.html
- **Mozilla SSL Configuration Generator**: https://ssl-config.mozilla.org/

---

## Support

For SSL/TLS issues, consult:

1. Application logs: Check for SSL-related errors
2. [docs/SECURITY.md](./SECURITY.md): Security documentation
3. GitHub Issues: Report problems

---

**Last Updated**: 2025-01-25 **Maintainer**: Waste Compliance Agent Team
