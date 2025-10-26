# Deployment Guide - Waste Compliance Agent

Complete guide for deploying the Waste Compliance Agent boilerplate to various
environments.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Quick Start

### For Local Development (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start PostgreSQL (if using Docker)
docker run -d \
  --name waste-compliance-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=waste_compliance \
  -p 5432:5432 \
  postgres:15

# 4. Initialize database
npm run db:init

# 5. Start server
npm start
```

Access at: `http://localhost:3000`

---

## Prerequisites

### Required

- ✅ **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- ✅ **PostgreSQL 15+**: Database server
- ✅ **Git**: Version control

### Optional (But Recommended)

- **Docker**: For containerized deployment
- **PM2**: Process manager for production
- **Nginx**: Reverse proxy and load balancer
- **Let's Encrypt**: Free SSL certificates

### Verify Installation

```bash
# Check versions
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 9.0.0
psql --version    # Should be >= 15.0
docker --version  # Optional
```

---

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/waste-compliance-agent.git
cd waste-compliance-agent
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Required Configuration:**

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_compliance
DB_USER=postgres
DB_PASSWORD=your_password_here

# AI Service (optional for testing)
AI_MOCK_MODE=true

# Security
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 4: Setup Database

**Option A: Local PostgreSQL**

```bash
# Create database
createdb waste_compliance

# Initialize schema
npm run db:init

# Seed with test data (optional)
npm run db:seed
```

**Option B: Docker PostgreSQL**

```bash
# Start PostgreSQL container
docker run -d \
  --name waste-compliance-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=waste_compliance \
  -p 5432:5432 \
  postgres:15

# Wait for database to be ready
sleep 5

# Initialize database
npm run db:init
```

### Step 5: Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
```

### Step 6: Start Development Server

```bash
# Start with hot-reload
npm run dev

# Or start normally
npm start
```

Access at: `http://localhost:3000`

---

## Production Deployment

### Step 1: Server Preparation

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15
sudo apt-get install -y postgresql-15 postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2
```

### Step 2: Clone and Install

```bash
# Create app directory
sudo mkdir -p /var/www/waste-compliance-agent
sudo chown $USER:$USER /var/www/waste-compliance-agent

# Clone repository
cd /var/www/waste-compliance-agent
git clone https://github.com/YOUR_USERNAME/waste-compliance-agent.git .

# Install dependencies (production only)
npm ci --production
```

### Step 3: Production Environment

```bash
# Create production environment file
cp .env.example .env
nano .env
```

**Production Configuration:**

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_compliance_prod
DB_USER=waste_compliance_user
DB_PASSWORD=STRONG_PASSWORD_HERE

# SSL/TLS
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
HTTP_REDIRECT=true

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
API_KEY=YOUR_GENERATED_API_KEY
API_KEY_SALT=YOUR_RANDOM_SALT

# AI Service
AI_MOCK_MODE=false
ANTHROPIC_API_KEY=sk-ant-YOUR-API-KEY
MODEL_ENDPOINT=https://api.anthropic.com/v1/messages

# Logging
LOG_LEVEL=info
```

### Step 4: Database Setup

```bash
# Create production database
sudo -u postgres psql << EOF
CREATE DATABASE waste_compliance_prod;
CREATE USER waste_compliance_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE waste_compliance_prod TO waste_compliance_user;
EOF

# Initialize database
npm run db:init
```

### Step 5: SSL Certificates

```bash
# Install Certbot
sudo apt-get install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Verify certificates
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Set up auto-renewal
sudo crontab -e
# Add: 0 0,12 * * * certbot renew --quiet --post-hook "pm2 restart waste-compliance-agent"
```

### Step 6: Start with PM2

```bash
# Start application
pm2 start src/server.js --name waste-compliance-agent

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the command output

# Monitor application
pm2 status
pm2 logs waste-compliance-agent
pm2 monit
```

### Step 7: Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify
sudo ufw status
```

---

## Docker Deployment

### Step 1: Build Docker Image

```bash
# Build image
docker build -t waste-compliance-agent:latest .

# Or use docker-compose
docker-compose build
```

### Step 2: Start Services

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 3: Initialize Database

```bash
# Run database initialization
docker-compose exec app npm run db:init

# Seed data (optional)
docker-compose exec app npm run db:seed
```

### Step 4: Verify Deployment

```bash
# Check health
curl http://localhost:3000/health

# Run tests
docker-compose exec app npm test
```

---

## Cloud Deployment

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-18 waste-compliance-agent

# Create environment
eb create waste-compliance-prod

# Deploy
eb deploy

# Open in browser
eb open
```

### Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS

# Login
heroku login

# Create app
heroku create waste-compliance-agent

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set AI_MOCK_MODE=false
heroku config:set ANTHROPIC_API_KEY=your_key

# Deploy
git push heroku main

# Initialize database
heroku run npm run db:init

# Open app
heroku open
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - **Build Command**: `npm ci`
   - **Run Command**: `npm start`
3. Add environment variables
4. Add PostgreSQL database
5. Deploy

### Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/waste-compliance-agent

# Deploy
gcloud run deploy waste-compliance-agent \
  --image gcr.io/PROJECT_ID/waste-compliance-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME \
  --set-env-vars NODE_ENV=production
```

---

## Post-Deployment Checklist

### Security

- [ ] SSL/TLS certificates installed and working
- [ ] HTTPS redirect enabled
- [ ] Strong database passwords set
- [ ] API keys generated and configured
- [ ] CORS whitelist configured
- [ ] Firewall rules applied
- [ ] Security monitoring enabled
- [ ] Run penetration tests: `npm run pentest`
- [ ] Verify security headers: `curl -I https://yourdomain.com`

### Performance

- [ ] Database connection pooling configured
- [ ] PM2 clustering enabled (if using PM2)
- [ ] Log rotation configured
- [ ] Monitoring and alerting set up
- [ ] Load testing completed

### Functionality

- [ ] Health check endpoint working: `/health`
- [ ] API endpoints responding correctly
- [ ] Database queries working
- [ ] AI service integration working (if enabled)
- [ ] All tests passing: `npm test`

### Operations

- [ ] Automated backups configured
- [ ] Log aggregation set up
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring enabled
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs waste-compliance-agent

# Check environment
node -e "import('./src/config/env.js')"

# Check database connection
npm run db:test
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U waste_compliance_user -d waste_compliance_prod

# Check credentials
cat .env | grep DB_
```

### SSL Certificate Issues

```bash
# Verify certificate files
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Test certificate
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Check SSL configuration
curl -I https://yourdomain.com
```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
PORT=8080 npm start
```

---

## Maintenance

### Update Application

```bash
# Pull latest changes
cd /var/www/waste-compliance-agent
git pull origin main

# Install new dependencies
npm install

# Run migrations (if any)
npm run migrate:latest

# Restart application
pm2 restart waste-compliance-agent
```

### Database Backup

```bash
# Backup database
pg_dump -U waste_compliance_user waste_compliance_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U waste_compliance_user waste_compliance_prod < backup_20250125.sql
```

### Monitor Resources

```bash
# CPU and Memory
pm2 monit

# Disk usage
df -h

# Database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('waste_compliance_prod'));"
```

---

## Scaling

### Horizontal Scaling

```bash
# PM2 cluster mode (uses all CPU cores)
pm2 start src/server.js -i max --name waste-compliance-agent

# With load balancer (Nginx)
# Configure Nginx upstream with multiple app instances
```

### Database Scaling

- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Database sharding for large datasets

---

## Support

- **Documentation**: `docs/` directory
- **Security**: [docs/SECURITY.md](./SECURITY.md)
- **SSL Setup**: [docs/SSL_SETUP.md](./SSL_SETUP.md)
- **Production Checklist**:
  [docs/PRODUCTION_SECURITY_CHECKLIST.md](./PRODUCTION_SECURITY_CHECKLIST.md)

---

**Last Updated**: 2025-01-25
