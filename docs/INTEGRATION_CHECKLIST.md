# Integration Checklist - Adding Waste Compliance Agent to Your Project

Complete checklist for integrating the Waste Compliance Agent boilerplate into your existing project or deploying as a standalone service.

---

## Integration Options

Choose the approach that best fits your needs:

1. **[Standalone Microservice](#option-1-standalone-microservice)** - Deploy as independent API service
2. **[Integrate into Existing Project](#option-2-integrate-into-existing-project)** - Add to monolithic application
3. **[Docker Container](#option-3-docker-container)** - Containerized deployment

---

## Option 1: Standalone Microservice

Deploy the Waste Compliance Agent as an independent API service.

### Prerequisites
- [ ] Domain name or subdomain (e.g., `api-waste.yourdomain.com`)
- [ ] Server or cloud instance (AWS, DigitalOcean, etc.)
- [ ] PostgreSQL database
- [ ] SSL certificate

### Steps

#### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/waste-compliance-agent.git
cd waste-compliance-agent

# Install dependencies
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required Configuration:**
```bash
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=waste_compliance
DB_USER=your_db_user
DB_PASSWORD=your_db_password
ALLOWED_ORIGINS=https://your-main-app.com
API_KEY=generate_with_npm_run_generate-api-key
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

#### 3. Database Setup

```bash
npm run db:init
```

#### 4. Generate Security Keys

```bash
npm run generate-api-key
# Copy output to .env
```

#### 5. SSL Setup

```bash
# Option A: Let's Encrypt (Free)
sudo certbot certonly --standalone -d api-waste.yourdomain.com

# Option B: Self-signed (Development only)
npm run setup-ssl-dev
```

#### 6. Deploy

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start src/server.js --name waste-compliance-api

# Save configuration
pm2 save
pm2 startup
```

#### 7. Verify Deployment

```bash
# Health check
curl https://api-waste.yourdomain.com/health

# Run tests
npm test

# Run security scan
npm run pentest
```

#### 8. Integration with Main App

**From your main application:**

```javascript
// Example: Node.js/Express app
const API_BASE = 'https://api-waste.yourdomain.com';
const API_KEY = 'your_api_key';

async function classifyWaste(labReportText) {
  const response = await fetch(`${API_BASE}/api/waste-profiles/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ labReportText })
  });
  return response.json();
}
```

**From frontend (React/Vue/etc):**

```javascript
// Add to your API client
const wasteAPI = {
  baseURL: 'https://api-waste.yourdomain.com',
  apiKey: process.env.REACT_APP_WASTE_API_KEY,

  async classifyWaste(labReportText) {
    const response = await fetch(`${this.baseURL}/api/waste-profiles/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ labReportText })
    });
    return response.json();
  }
};
```

---

## Option 2: Integrate into Existing Project

Add the Waste Compliance Agent code to your existing Node.js application.

### Prerequisites
- [ ] Existing Node.js/Express application
- [ ] PostgreSQL database (can share with existing app)
- [ ] Node.js 18+

### Steps

#### 1. Copy Core Files

```bash
# In your existing project root
mkdir -p src/modules/waste-compliance

# Copy service files
cp -r /path/to/waste-compliance-agent/src/services/* src/modules/waste-compliance/services/
cp -r /path/to/waste-compliance-agent/src/routes/* src/modules/waste-compliance/routes/
cp -r /path/to/waste-compliance-agent/src/middleware/* src/modules/waste-compliance/middleware/
```

#### 2. Install Dependencies

```bash
# Add to your package.json
npm install express-validator helmet express-rate-limit cors pino pino-pretty pg knex uuid node-forge
```

#### 3. Database Integration

**Option A: Separate Schema (Recommended)**

```sql
-- Create separate schema
CREATE SCHEMA waste_compliance;

-- Modify tables to use schema
CREATE TABLE waste_compliance.facilities (...);
CREATE TABLE waste_compliance.manifests (...);
```

**Option B: Shared Database**

```bash
# Run migrations with prefix
npm run migrate:latest
```

#### 4. Mount Routes in Your App

```javascript
// In your main server.js or app.js
import wasteProfileRoutes from './modules/waste-compliance/routes/wasteProfile.js';
import facilityRoutes from './modules/waste-compliance/routes/facility.js';
import manifestRoutes from './modules/waste-compliance/routes/manifest.js';

// Add security middleware
import { securityHeaders, jsonSanitizer } from './modules/waste-compliance/middleware/security.js';
import { sanitizeInputs } from './modules/waste-compliance/middleware/validation.js';

app.use(securityHeaders);
app.use(jsonSanitizer);
app.use(sanitizeInputs);

// Mount waste compliance routes
app.use('/api/waste-profiles', wasteProfileRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/manifests', manifestRoutes);
```

#### 5. Environment Variables

Add to your `.env`:

```bash
# Waste Compliance Configuration
AI_MOCK_MODE=true
ANTHROPIC_API_KEY=sk-ant-your-key
MODEL_ENDPOINT=https://api.anthropic.com/v1/messages
```

#### 6. Test Integration

```bash
# Run tests
npm test

# Test endpoints
curl http://localhost:3000/api/waste-profiles/classify \
  -H "Content-Type: application/json" \
  -d '{"labReportText": "Sample report..."}'
```

---

## Option 3: Docker Container

Deploy as a Docker container alongside your existing services.

### Prerequisites
- [ ] Docker installed
- [ ] docker-compose (optional but recommended)
- [ ] PostgreSQL (can use Docker container)

### Steps

#### 1. Use Provided Docker Configuration

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/waste-compliance-agent.git
cd waste-compliance-agent

# Build image
docker build -t waste-compliance-agent:latest .
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  waste-compliance-api:
    image: waste-compliance-agent:latest
    container_name: waste-compliance-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: waste_compliance
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
      API_KEY: ${API_KEY}
    depends_on:
      - postgres
    networks:
      - waste-compliance-network

  postgres:
    image: postgres:15-alpine
    container_name: waste-compliance-db
    environment:
      POSTGRES_DB: waste_compliance
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - waste-compliance-network

volumes:
  postgres-data:

networks:
  waste-compliance-network:
    driver: bridge
```

#### 3. Start Services

```bash
# Create .env file
cp .env.example .env

# Start services
docker-compose up -d

# Initialize database
docker-compose exec waste-compliance-api npm run db:init

# Check logs
docker-compose logs -f
```

#### 4. Integrate with Existing Docker Network

If you have existing Docker services:

```yaml
# Add to your existing docker-compose.yml
services:
  waste-compliance-api:
    image: waste-compliance-agent:latest
    networks:
      - your-existing-network  # Connect to your network
    environment:
      # ... configuration

networks:
  your-existing-network:
    external: true  # Use existing network
```

---

## Post-Integration Checklist

### Functional Testing
- [ ] Health check endpoint accessible
- [ ] Waste classification working
- [ ] Facility search working
- [ ] Manifest generation working
- [ ] Database connections stable
- [ ] All API endpoints responding

### Security Verification
- [ ] API key authentication working
- [ ] CORS configured correctly
- [ ] SSL/TLS enabled (production)
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Security headers present
- [ ] Run: `npm run pentest`

### Performance
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] Connection pooling configured
- [ ] Load testing completed
- [ ] Monitoring set up

### Documentation
- [ ] API documentation updated
- [ ] Team trained on new endpoints
- [ ] Integration examples provided
- [ ] Error handling documented

---

## API Endpoints Reference

### Core Endpoints

```bash
# Health Check
GET /health

# Waste Classification
POST /api/waste-profiles/classify
Body: { "labReportText": "..." }

# Generate Waste Profile
POST /api/waste-profiles/generate
Body: { "classificationResult": {...} }

# Search Facilities
POST /api/facilities/search
Body: { "wasteProfile": {...} }

# Calculate Route
POST /api/facilities/route
Body: { "wasteProfile": {...}, "originZip": "..." }

# Create Manifest
POST /api/manifests
Body: { "generatorId": "...", "transporterId": "...", ... }

# Track Manifest
GET /api/manifests/:manifestId
```

### Example API Call

```bash
curl https://api-waste.yourdomain.com/api/waste-profiles/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "labReportText": "Flash point: 85°F\nTotal petroleum hydrocarbons: 12,500 mg/kg"
  }'
```

---

## Common Integration Patterns

### Pattern 1: Microservices Architecture

```
┌─────────────┐      ┌─────────────────────┐
│   Main App  │─────▶│ Waste Compliance    │
│  (Frontend) │      │    API Service      │
└─────────────┘      └─────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   PostgreSQL    │
                     └─────────────────┘
```

### Pattern 2: Monolithic Integration

```
┌───────────────────────────────────────┐
│        Main Application               │
│  ┌─────────────────────────────────┐ │
│  │  Waste Compliance Module        │ │
│  │  - Services                     │ │
│  │  - Routes                       │ │
│  │  - Middleware                   │ │
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
                │
                ▼
        ┌─────────────┐
        │ PostgreSQL  │
        └─────────────┘
```

### Pattern 3: Docker Compose

```
┌─────────────┐    ┌──────────────────┐
│  Frontend   │───▶│ Nginx Reverse    │
│  Container  │    │     Proxy        │
└─────────────┘    └──────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐    ┌────────▼────────┐
        │   Main App     │    │ Waste Compliance│
        │   Container    │    │    Container    │
        └────────────────┘    └─────────────────┘
                │                      │
                └──────────┬───────────┘
                           ▼
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  │    Container    │
                  └─────────────────┘
```

---

## Troubleshooting Integration Issues

### Database Connection Errors

```bash
# Check database is accessible
psql -h localhost -U waste_compliance_user -d waste_compliance

# Verify connection string
node -e "import('./src/config/env.js').then(() => console.log('Config OK'))"

# Check network connectivity (Docker)
docker-compose exec waste-compliance-api ping postgres
```

### CORS Errors

```bash
# Check CORS configuration
curl -H "Origin: https://your-app.com" -I https://api-waste.yourdomain.com/health

# Verify ALLOWED_ORIGINS in .env
echo $ALLOWED_ORIGINS
```

### API Key Authentication Failing

```bash
# Test with API key
curl -H "X-API-Key: your_key" https://api-waste.yourdomain.com/api/waste-profiles/classify

# Verify API key in .env
grep API_KEY .env
```

---

## Support Resources

- **Deployment Guide**: [docs/DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Security Guide**: [docs/SECURITY.md](./SECURITY.md)
- **SSL Setup**: [docs/SSL_SETUP.md](./SSL_SETUP.md)
- **Production Checklist**: [docs/PRODUCTION_SECURITY_CHECKLIST.md](./PRODUCTION_SECURITY_CHECKLIST.md)
- **API Documentation**: `README.md`

---

## Quick Command Reference

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start dev server
npm test            # Run tests
npm run lint        # Check code quality

# Production
npm run generate-api-key  # Generate API key
npm run setup-ssl-dev     # Setup SSL (dev)
npm start                 # Start production server

# Docker
docker-compose up -d      # Start all services
docker-compose logs -f    # View logs
docker-compose down       # Stop services

# Security
npm run pentest          # Run penetration tests
npm audit                # Check vulnerabilities
npm run security-monitor # Start monitoring
```

---

**Last Updated**: 2025-01-25
