# Claude API Setup Guide

This guide explains how to configure the Waste Compliance Agent to use the real Claude API instead of mock mode.

## Prerequisites

1. Anthropic API account: https://console.anthropic.com/
2. API key with sufficient credits
3. Understanding of rate limits and pricing

## Configuration Steps

### 1. Get Your API Key

1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

### 2. Update Environment Variables

Edit your `.env` file:

```bash
# Disable mock mode
AI_MOCK_MODE=false

# Set your API key
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# API endpoint (default is correct for most users)
MODEL_ENDPOINT=https://api.anthropic.com/v1

# Optional: Change model version
# AI_MODEL_NAME=claude-3-5-sonnet-20241022

# Optional: Adjust timeout (in milliseconds)
# AI_MODEL_TIMEOUT=60000
```

### 3. Test the Configuration

Run the test script to verify your API connection:

```bash
npm test -- tests/integration/api.test.js
```

Or test manually with curl:

```bash
curl -X POST http://localhost:3000/api/waste-profiles/classify \
  -H "Content-Type: application/json" \
  -d '{
    "labReportText": "Chemical: Acetone 90%, Flash Point: -4°F"
  }'
```

## Error Handling

The application includes comprehensive error handling for Claude API:

### Common Errors

#### Authentication Error (401)
```
Error: Invalid API key or authentication failed
```
**Solution**: Verify your API key in `.env` file

#### Rate Limit Error (429)
```
Error: Rate limit exceeded. Please try again later.
```
**Solution**: Wait for the retry-after period or upgrade your plan

#### Model Overloaded (529)
```
Error: AI service is temporarily overloaded
```
**Solution**: The system will automatically retry. If persistent, try again later.

#### Timeout Error (408)
```
Error: Request timed out after 60000ms
```
**Solution**: Increase `AI_MODEL_TIMEOUT` in `.env` or check network connectivity

### Automatic Retry Logic

The system automatically retries on:
- Rate limit errors (with exponential backoff)
- Model overload errors
- Timeout errors
- Network errors

Retries are NOT attempted for:
- Authentication errors (401)
- Invalid requests (400)
- Safety violations

## Rate Limits & Pricing

### Anthropic Rate Limits (as of 2024)

**Free Tier:**
- 5 requests per minute
- 50,000 tokens per day

**Paid Tier:**
- 50 requests per minute
- 500,000 tokens per day (varies by plan)

### Pricing (Claude 3.5 Sonnet)

- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

**Example cost calculation:**
```
Waste classification request:
- Input: ~500 tokens = $0.0015
- Output: ~200 tokens = $0.003
- Total per request: ~$0.0045
```

## Production Best Practices

### 1. API Key Security

```bash
# NEVER commit API keys to git
echo ".env" >> .gitignore

# Use environment variables in production
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 2. Monitoring

Check health endpoint for AI service status:

```bash
curl http://localhost:3000/health/ai
```

Response:
```json
{
  "status": "available",
  "mode": "production",
  "endpoint": "https://api.anthropic.com/v1",
  "configured": true
}
```

### 3. Cost Control

Enable caching to reduce API calls:

```javascript
// Caching is enabled by default
await claudeClient.generateCompletion(prompt, {
  enableCache: true,  // Cache responses for 1 hour
  cacheTtlMs: 3600000
});
```

### 4. Safety Checks

Safety layer is enabled by default:

```javascript
await claudeClient.generateCompletion(prompt, {
  enableSafety: true,  // Filter PII and unsafe content
});
```

## Switching Between Mock and Production

### Development: Use Mock Mode
```bash
AI_MOCK_MODE=true
```

Benefits:
- No API costs
- Faster responses
- No rate limits
- Predictable outputs for testing

### Staging: Use Production API
```bash
AI_MOCK_MODE=false
ANTHROPIC_API_KEY=sk-ant-staging-key
```

### Production: Use Production API with Monitoring
```bash
NODE_ENV=production
AI_MOCK_MODE=false
ANTHROPIC_API_KEY=sk-ant-production-key
LOG_LEVEL=info
```

## Troubleshooting

### Check API Key Validity

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### View Application Logs

```bash
# Docker
docker-compose logs -f app

# Direct
npm start
```

Look for:
```
[claude-client] Running in MOCK mode  # Mock mode active
[claude-client] Request succeeded     # API call successful
```

## Additional Resources

- Anthropic API Documentation: https://docs.anthropic.com/
- Rate Limits: https://docs.anthropic.com/en/api/rate-limits
- Pricing: https://www.anthropic.com/pricing
- Status Page: https://status.anthropic.com/
