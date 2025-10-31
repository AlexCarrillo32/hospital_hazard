# Vercel Deployment Guide

## Quick Fixes Applied

✅ **Fixed**: Changed `package.json` engines from `"node": ">=18.0.0"` to `"node": "20.x"`
- Prevents automatic upgrades to new major Node.js versions that might have breaking changes

✅ **Fixed**: Updated Vercel configuration to modern format
- Uses `rewrites` instead of deprecated `builds` configuration
- Entry point: `api/index.js` (serverless function wrapper)
- No more "unused build settings" warnings

✅ **Fixed**: Upgraded `supertest` from `^6.3.3` to `^7.1.3`
- Eliminates deprecation warnings during npm install

---

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **PostgreSQL Database**: You'll need a hosted PostgreSQL database

### Recommended Database Providers

- **Vercel Postgres** (easiest, integrated)
- **Neon** (serverless, free tier)
- **Supabase** (includes auth and storage)
- **Railway** (simple, generous free tier)
- **AWS RDS** (enterprise-grade)

---

## Step 1: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database
3. Select PostgreSQL
4. Copy the connection string (it will start with `postgres://`)

### Option B: Neon (Serverless PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add connection pooling parameter: `?sslmode=require`

---

## Step 2: Configure Environment Variables in Vercel

In your Vercel project settings → Environment Variables, add these:

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Server Port (Vercel handles this automatically)
PORT=3000

# API Security - GENERATE NEW KEYS!
API_KEY=<generate-new-secure-key>
API_KEY_SALT=<generate-new-salt>

# Database (from your PostgreSQL provider)
DB_HOST=<your-db-host>
DB_PORT=5432
DB_NAME=<your-db-name>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>

# AI Service
AI_MOCK_MODE=false
MODEL_ENDPOINT=https://api.anthropic.com/v1/messages
ANTHROPIC_API_KEY=<your-anthropic-key>

# CORS (your frontend URL)
ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Logging
LOG_LEVEL=info
```

### Generate Secure Keys

Run these commands locally to generate secure keys:

```bash
# Generate API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Generate API_KEY_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Express.js
4. Click "Deploy"

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd /path/to/waste-compliance-agent
vercel --prod
```

---

## Step 4: Run Database Migrations

After deployment, you need to run migrations on your production database.

### Option A: Run Migrations Locally (Recommended)

```bash
# Set up connection to production DB
export DB_HOST=<production-db-host>
export DB_PORT=5432
export DB_NAME=<production-db-name>
export DB_USER=<production-db-user>
export DB_PASSWORD=<production-db-password>
export NODE_ENV=production

# Run migrations
npm run migrate:latest

# Verify migration status
npm run migrate:status
```

### Option B: Add Build Command in Vercel

In `vercel.json`, add:

```json
{
  "buildCommand": "npm install && npm run migrate:latest"
}
```

**Note**: This only works if your database is accessible during build time.

---

## Step 5: Verify Deployment

### Test Health Endpoint

```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-30T...",
  "version": "1.0.0",
  "database": "connected"
}
```

### Test API Endpoint

```bash
curl -X POST https://your-app.vercel.app/api/waste-profiles/classify \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "labReportText": "Chemical: Acetone 90%, Flash Point: -4°F"
  }'
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module" errors

**Cause**: Missing dependencies in `package.json`

**Solution**: Ensure all imports are in `dependencies`, not `devDependencies`

```bash
# Move from devDependencies to dependencies if needed
npm install --save-prod pg knex
```

### Issue 2: Database connection fails

**Cause**: Database not accessible from Vercel

**Solution**: Check these:
1. Database allows connections from `0.0.0.0/0` (all IPs)
2. SSL is enabled: add `?ssl=true` or `?sslmode=require` to connection string
3. Environment variables are correctly set in Vercel

### Issue 3: "Function execution timed out"

**Cause**: Vercel has 10s timeout on Hobby plan, 60s on Pro

**Solution**:
- Optimize database queries
- Use connection pooling
- Upgrade to Pro plan if needed

### Issue 4: Cold starts are slow

**Cause**: Vercel serverless functions need to cold start

**Solution**:
- Keep warm with uptime monitoring (Uptime Robot, Better Uptime)
- Upgrade to Pro for faster cold starts
- Consider Vercel Edge Functions for critical endpoints

---

## Performance Optimization

### 1. Connection Pooling

Update `knexfile.js` for production:

```javascript
production: {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  }
}
```

### 2. Caching

Consider adding Redis for caching:
- Vercel KV (Redis-compatible)
- Upstash Redis (serverless)

### 3. Monitoring

Enable monitoring in Vercel:
- Go to Project → Analytics
- Enable Speed Insights
- Monitor function execution times

---

## Security Checklist

Before going live:

- [ ] Generate new API keys (don't use development keys)
- [ ] Set `AI_MOCK_MODE=false` for production
- [ ] Enable HTTPS only (Vercel does this automatically)
- [ ] Set proper CORS origins (not `*`)
- [ ] Review database user permissions
- [ ] Enable database connection SSL
- [ ] Set up error alerting (Sentry, LogRocket)
- [ ] Configure rate limiting for API endpoints
- [ ] Review and rotate API keys regularly

---

## Cost Estimation

### Vercel Costs
- **Hobby Plan**: Free (100GB bandwidth/month)
- **Pro Plan**: $20/month (1TB bandwidth/month)

### Database Costs
- **Neon**: Free tier (500MB)
- **Vercel Postgres**: $20/month (256MB)
- **Supabase**: Free tier (500MB)

### AI API Costs
- **Claude API**: Pay per token
  - Input: ~$3 per million tokens
  - Output: ~$15 per million tokens

---

## Rollback Strategy

If deployment fails:

### Via Vercel Dashboard
1. Go to Deployments
2. Find previous successful deployment
3. Click "..." → Promote to Production

### Via Vercel CLI
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

---

## Monitoring & Logs

### View Logs in Real-Time

```bash
# Via Vercel CLI
vercel logs --follow
```

### Via Vercel Dashboard
1. Go to your project
2. Click Deployments → Your deployment
3. Click "View Function Logs"

---

## Next Steps

After successful deployment:

1. **Set up custom domain**: Project → Settings → Domains
2. **Enable analytics**: Project → Analytics
3. **Configure monitoring**: Set up Sentry or similar
4. **Set up CI/CD**: Automatic deployments on git push
5. **Document API**: Create API documentation with Swagger
6. **Load testing**: Test with realistic traffic

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Discord**: [vercel.com/discord](https://vercel.com/discord)
- **This Project**: See `README.md` and `docs/` folder

---

## Summary

✅ Fixed Node.js version warning
✅ Created `vercel.json` configuration
✅ Documented environment variables needed
✅ Provided step-by-step deployment guide
✅ Included troubleshooting section

Your app is now ready to deploy to Vercel! 🚀
