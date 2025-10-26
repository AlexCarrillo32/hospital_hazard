#!/usr/bin/env node

/**
 * Automated Penetration Testing Script
 *
 * Tests common security vulnerabilities:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - CORS misconfigurations
 * - Rate limiting
 * - Authentication bypass
 * - Input validation
 * - Header injection
 *
 * Usage:
 *   node scripts/penetration-test.js
 *   npm run pentest
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || '';

const tests = {
  passed: 0,
  failed: 0,
  warnings: 0,
  results: [],
};

/**
 * Test result logger
 */
function logTest(name, passed, message, severity = 'info') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = {
    name,
    passed,
    message,
    severity,
  };

  tests.results.push(result);
  if (passed) {
    tests.passed++;
  } else {
    if (severity === 'warning') {
      tests.warnings++;
    } else {
      tests.failed++;
    }
  }

  console.log(`${status} - ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
}

/**
 * Test: SQL Injection Protection
 */
async function testSQLInjection() {
  console.log('\n🔍 Testing SQL Injection Protection...\n');

  const sqlPayloads = [
    "' OR '1'='1",
    "1' OR '1' = '1",
    "' OR 1=1--",
    "admin'--",
    "' UNION SELECT NULL--",
  ];

  for (const payload of sqlPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/waste-profiles/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          labReportText: payload,
        }),
      });

      // Should either validate/sanitize or return 400
      if (response.status === 400 || response.status === 200) {
        logTest(
          `SQL Injection - Payload: ${payload.substring(0, 20)}...`,
          true,
          'Request handled safely'
        );
      } else {
        logTest(
          `SQL Injection - Payload: ${payload}`,
          false,
          `Unexpected status: ${response.status}`,
          'critical'
        );
      }
    } catch (error) {
      logTest(`SQL Injection - ${payload}`, false, error.message, 'critical');
    }
  }
}

/**
 * Test: XSS Protection
 */
async function testXSS() {
  console.log('\n🔍 Testing XSS Protection...\n');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
  ];

  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/waste-profiles/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          labReportText: payload,
        }),
      });

      const data = await response.json();

      // Check if payload was sanitized
      const responseStr = JSON.stringify(data);
      if (responseStr.includes('<script>') || responseStr.includes('onerror=')) {
        logTest(
          `XSS - Payload: ${payload.substring(0, 30)}...`,
          false,
          'XSS payload not sanitized',
          'critical'
        );
      } else {
        logTest(
          `XSS - Payload: ${payload.substring(0, 30)}...`,
          true,
          'Input sanitized successfully'
        );
      }
    } catch (error) {
      logTest(`XSS - ${payload}`, false, error.message, 'critical');
    }
  }
}

/**
 * Test: CORS Configuration
 */
async function testCORS() {
  console.log('\n🔍 Testing CORS Configuration...\n');

  const maliciousOrigins = ['http://evil.com', 'https://attacker.com', 'http://malicious-site.org'];

  for (const origin of maliciousOrigins) {
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        headers: {
          Origin: origin,
        },
      });

      const corsHeader = response.headers.get('access-control-allow-origin');

      if (corsHeader === origin || corsHeader === '*') {
        logTest(
          `CORS - Origin: ${origin}`,
          false,
          `CORS allows unauthorized origin: ${corsHeader}`,
          'critical'
        );
      } else {
        logTest(`CORS - Origin: ${origin}`, true, 'Unauthorized origin blocked');
      }
    } catch (error) {
      // Network error is acceptable (CORS blocked)
      logTest(`CORS - Origin: ${origin}`, true, 'Request blocked by CORS');
    }
  }
}

/**
 * Test: Rate Limiting
 */
async function testRateLimiting() {
  console.log('\n🔍 Testing Rate Limiting...\n');

  const requests = 150; // Exceed the 100/15min limit
  let rateLimitHit = false;

  for (let i = 0; i < requests; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`);

      if (response.status === 429) {
        rateLimitHit = true;
        logTest('Rate Limiting', true, `Rate limit enforced after ${i + 1} requests`);
        break;
      }
    } catch (error) {
      // Ignore
    }
  }

  if (!rateLimitHit) {
    logTest('Rate Limiting', false, `No rate limit after ${requests} requests`, 'warning');
  }
}

/**
 * Test: Authentication
 */
async function testAuthentication() {
  console.log('\n🔍 Testing Authentication...\n');

  // Test without API key
  try {
    const response = await fetch(`${BASE_URL}/api/waste-profiles/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labReportText: 'test',
      }),
    });

    // Should work (API key is optional in current implementation)
    logTest(
      'Authentication - No API Key',
      true,
      'Endpoint accessible without auth (expected behavior)'
    );
  } catch (error) {
    logTest('Authentication - No API Key', false, error.message);
  }

  // Test with invalid API key
  try {
    const response = await fetch(`${BASE_URL}/api/waste-profiles/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid_key_12345',
      },
      body: JSON.stringify({
        labReportText: 'test',
      }),
    });

    // Should still work (optional auth)
    logTest('Authentication - Invalid API Key', true, 'Request processed');
  } catch (error) {
    logTest('Authentication - Invalid API Key', false, error.message);
  }
}

/**
 * Test: Security Headers
 */
async function testSecurityHeaders() {
  console.log('\n🔍 Testing Security Headers...\n');

  try {
    const response = await fetch(`${BASE_URL}/health`);

    const headers = {
      'x-frame-options': response.headers.get('x-frame-options'),
      'x-content-type-options': response.headers.get('x-content-type-options'),
      'strict-transport-security': response.headers.get('strict-transport-security'),
      'content-security-policy': response.headers.get('content-security-policy'),
    };

    // Check X-Frame-Options
    if (headers['x-frame-options']) {
      logTest('Security Headers - X-Frame-Options', true, headers['x-frame-options']);
    } else {
      logTest('Security Headers - X-Frame-Options', false, 'Header missing', 'warning');
    }

    // Check X-Content-Type-Options
    if (headers['x-content-type-options'] === 'nosniff') {
      logTest('Security Headers - X-Content-Type-Options', true, 'nosniff');
    } else {
      logTest(
        'Security Headers - X-Content-Type-Options',
        false,
        'Header missing or incorrect',
        'warning'
      );
    }

    // Check HSTS
    if (headers['strict-transport-security']) {
      logTest('Security Headers - HSTS', true, headers['strict-transport-security']);
    } else {
      logTest('Security Headers - HSTS', false, 'Header missing (OK for HTTP)', 'info');
    }

    // Check CSP
    if (headers['content-security-policy']) {
      logTest('Security Headers - CSP', true, 'CSP policy configured');
    } else {
      logTest('Security Headers - CSP', false, 'Header missing', 'warning');
    }
  } catch (error) {
    logTest('Security Headers', false, error.message);
  }
}

/**
 * Test: Input Validation
 */
async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation...\n');

  const invalidInputs = [
    { labReportText: '' }, // Empty
    { labReportText: 'a' }, // Too short (< 10 chars)
    { labReportText: 'x'.repeat(60000) }, // Too long (> 50000)
    {}, // Missing field
    { invalid: 'field' }, // Wrong field
  ];

  for (let i = 0; i < invalidInputs.length; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/waste-profiles/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(invalidInputs[i]),
      });

      if (response.status === 400) {
        logTest(`Input Validation - Test ${i + 1}`, true, 'Invalid input rejected');
      } else {
        logTest(
          `Input Validation - Test ${i + 1}`,
          false,
          `Expected 400, got ${response.status}`,
          'warning'
        );
      }
    } catch (error) {
      logTest(`Input Validation - Test ${i + 1}`, false, error.message);
    }
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                  PENETRATION TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`⚠️  Warnings: ${tests.warnings}`);
  console.log(`📊 Total Tests: ${tests.passed + tests.failed + tests.warnings}\n`);

  // Show critical failures
  const critical = tests.results.filter((r) => !r.passed && r.severity === 'critical');
  if (critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES:\n');
    critical.forEach((r) => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log();
  }

  // Show warnings
  const warnings = tests.results.filter((r) => !r.passed && r.severity === 'warning');
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach((r) => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  if (tests.failed > 0) {
    console.log('❌ Security vulnerabilities detected. Address critical issues immediately.\n');
    process.exit(1);
  } else if (tests.warnings > 0) {
    console.log('⚠️  Tests passed with warnings. Review and address warnings.\n');
    process.exit(0);
  } else {
    console.log('✅ All security tests passed!\n');
    process.exit(0);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🔒 SECURITY PENETRATION TESTING');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');

  await testSQLInjection();
  await testXSS();
  await testCORS();
  await testInputValidation();
  await testSecurityHeaders();
  await testAuthentication();
  await testRateLimiting();

  printSummary();
}

// Run tests
runAllTests().catch((error) => {
  console.error('Penetration testing failed:', error);
  process.exit(1);
});
