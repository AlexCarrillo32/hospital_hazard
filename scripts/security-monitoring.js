#!/usr/bin/env node

/**
 * Security Monitoring and Alerting System
 *
 * Monitors application logs for security events and triggers alerts:
 * - Failed authentication attempts
 * - Rate limit violations
 * - CORS policy violations
 * - CSP violations
 * - Suspicious patterns
 *
 * Usage:
 *   node scripts/security-monitoring.js
 *   npm run security-monitor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const config = {
  logFile: process.env.LOG_FILE || './logs/app.log',
  alertThresholds: {
    failedAuth: 5, // Alert after 5 failed auth attempts from same IP
    rateLimitViolations: 3, // Alert after 3 rate limit hits
    corsViolations: 10, // Alert after 10 CORS blocks
    cspViolations: 5, // Alert after 5 CSP violations
  },
  windowMinutes: 15, // Time window for counting violations
  checkIntervalSeconds: 60, // How often to check logs
};

// Tracking state
const state = {
  failedAuth: new Map(), // IP -> count
  rateLimitViolations: new Map(),
  corsViolations: new Map(),
  cspViolations: [],
  lastCheck: Date.now(),
};

/**
 * Parse log line and extract security events
 */
function parseLogLine(line) {
  try {
    const log = JSON.parse(line);
    return log;
  } catch {
    return null;
  }
}

/**
 * Check for security events in log
 */
function checkSecurityEvent(log) {
  if (!log) return null;

  // Failed authentication
  if (log.msg?.includes('Invalid API key') || log.msg?.includes('API key missing')) {
    return {
      type: 'failed_auth',
      ip: log.ip,
      timestamp: log.time,
      message: log.msg,
    };
  }

  // Rate limit violations
  if (log.msg?.includes('Rate limit exceeded')) {
    return {
      type: 'rate_limit',
      ip: log.ip,
      path: log.path,
      timestamp: log.time,
    };
  }

  // CORS violations
  if (log.msg?.includes('CORS request blocked')) {
    return {
      type: 'cors_violation',
      origin: log.origin,
      timestamp: log.time,
    };
  }

  // CSP violations
  if (log.msg?.includes('CSP Violation')) {
    return {
      type: 'csp_violation',
      report: log.cspReport,
      timestamp: log.time,
    };
  }

  return null;
}

/**
 * Update state with security event
 */
function updateState(event) {
  if (!event) return;

  const now = Date.now();
  const windowMs = config.windowMinutes * 60 * 1000;

  switch (event.type) {
    case 'failed_auth':
      if (!state.failedAuth.has(event.ip)) {
        state.failedAuth.set(event.ip, []);
      }
      state.failedAuth.get(event.ip).push(event.timestamp);
      // Clean old entries
      state.failedAuth.set(
        event.ip,
        state.failedAuth.get(event.ip).filter((t) => now - t < windowMs)
      );
      break;

    case 'rate_limit':
      if (!state.rateLimitViolations.has(event.ip)) {
        state.rateLimitViolations.set(event.ip, []);
      }
      state.rateLimitViolations.get(event.ip).push(event);
      state.rateLimitViolations.set(
        event.ip,
        state.rateLimitViolations.get(event.ip).filter((e) => now - e.timestamp < windowMs)
      );
      break;

    case 'cors_violation':
      if (!state.corsViolations.has(event.origin)) {
        state.corsViolations.set(event.origin, []);
      }
      state.corsViolations.get(event.origin).push(event.timestamp);
      state.corsViolations.set(
        event.origin,
        state.corsViolations.get(event.origin).filter((t) => now - t < windowMs)
      );
      break;

    case 'csp_violation':
      state.cspViolations.push(event);
      state.cspViolations = state.cspViolations.filter((e) => now - e.timestamp < windowMs);
      break;
  }
}

/**
 * Check if thresholds exceeded and trigger alerts
 */
function checkThresholds() {
  const alerts = [];

  // Failed authentication
  for (const [ip, attempts] of state.failedAuth.entries()) {
    if (attempts.length >= config.alertThresholds.failedAuth) {
      alerts.push({
        severity: 'HIGH',
        type: 'FAILED_AUTH',
        message: `${attempts.length} failed authentication attempts from IP: ${ip}`,
        ip,
        count: attempts.length,
      });
    }
  }

  // Rate limit violations
  for (const [ip, violations] of state.rateLimitViolations.entries()) {
    if (violations.length >= config.alertThresholds.rateLimitViolations) {
      alerts.push({
        severity: 'MEDIUM',
        type: 'RATE_LIMIT_ABUSE',
        message: `${violations.length} rate limit violations from IP: ${ip}`,
        ip,
        count: violations.length,
        paths: violations.map((v) => v.path),
      });
    }
  }

  // CORS violations
  for (const [origin, violations] of state.corsViolations.entries()) {
    if (violations.length >= config.alertThresholds.corsViolations) {
      alerts.push({
        severity: 'MEDIUM',
        type: 'CORS_ABUSE',
        message: `${violations.length} CORS violations from origin: ${origin}`,
        origin,
        count: violations.length,
      });
    }
  }

  // CSP violations
  if (state.cspViolations.length >= config.alertThresholds.cspViolations) {
    alerts.push({
      severity: 'LOW',
      type: 'CSP_VIOLATIONS',
      message: `${state.cspViolations.length} CSP violations detected`,
      count: state.cspViolations.length,
    });
  }

  return alerts;
}

/**
 * Send alert (console for now, can be extended to email/Slack/PagerDuty)
 */
function sendAlert(alert) {
  console.log('\n🚨 SECURITY ALERT 🚨');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Severity: ${alert.severity}`);
  console.log(`Type: ${alert.type}`);
  console.log(`Message: ${alert.message}`);
  console.log(`Time: ${new Date().toISOString()}`);
  if (alert.ip) console.log(`IP Address: ${alert.ip}`);
  if (alert.origin) console.log(`Origin: ${alert.origin}`);
  if (alert.paths) console.log(`Paths: ${alert.paths.join(', ')}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // TODO: Integrate with alerting services
  // - Send email via SendGrid/AWS SES
  // - Post to Slack webhook
  // - Create PagerDuty incident
  // - Log to SIEM system
}

/**
 * Process log file for security events
 */
async function processLogs() {
  try {
    if (!fs.existsSync(config.logFile)) {
      console.log(`⚠️  Log file not found: ${config.logFile}`);
      return;
    }

    const content = fs.readFileSync(config.logFile, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      const log = parseLogLine(line);
      const event = checkSecurityEvent(log);
      if (event) {
        updateState(event);
      }
    }

    // Check thresholds and send alerts
    const alerts = checkThresholds();
    for (const alert of alerts) {
      sendAlert(alert);
    }

    state.lastCheck = Date.now();
  } catch (error) {
    console.error('Error processing logs:', error.message);
  }
}

/**
 * Start monitoring
 */
async function startMonitoring() {
  console.log('🔍 Security Monitoring Started');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Log File: ${config.logFile}`);
  console.log(`Check Interval: ${config.checkIntervalSeconds}s`);
  console.log(`Alert Window: ${config.windowMinutes} minutes`);
  console.log('Thresholds:');
  console.log(`  - Failed Auth: ${config.alertThresholds.failedAuth}`);
  console.log(`  - Rate Limits: ${config.alertThresholds.rateLimitViolations}`);
  console.log(`  - CORS Violations: ${config.alertThresholds.corsViolations}`);
  console.log(`  - CSP Violations: ${config.alertThresholds.cspViolations}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Initial check
  await processLogs();

  // Schedule periodic checks
  setInterval(async () => {
    await processLogs();
  }, config.checkIntervalSeconds * 1000);
}

// Start monitoring
startMonitoring().catch((error) => {
  console.error('Failed to start security monitoring:', error);
  process.exit(1);
});
