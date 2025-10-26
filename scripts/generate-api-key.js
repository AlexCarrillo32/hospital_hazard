#!/usr/bin/env node

/**
 * Generate a secure API key for the Waste Compliance Agent
 *
 * Usage:
 *   node scripts/generate-api-key.js
 *   npm run generate-api-key
 */

import crypto from 'crypto';

function generateApiKey() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashApiKey(apiKey, salt) {
  return crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512').toString('hex');
}

console.log('🔐 Generating new API key...\n');

const apiKey = generateApiKey();
const salt = generateSalt();
const hash = hashApiKey(apiKey, salt);

console.log('✅ API Key generated successfully!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📋 ADD THIS TO YOUR .env FILE:\n');
console.log(`API_KEY=${apiKey}`);
console.log(`API_KEY_SALT=${salt}\n`);
console.log('═══════════════════════════════════════════════════════════\n');
console.log('💾 FOR DATABASE STORAGE (if using key rotation):\n');
console.log(`API Key Hash: ${hash}`);
console.log(`Salt: ${salt}\n`);
console.log('═══════════════════════════════════════════════════════════\n');
console.log('⚠️  SECURITY WARNINGS:');
console.log('   • Store the API key securely - it will only be shown once');
console.log('   • Never commit API keys to version control');
console.log('   • Use different keys for development and production');
console.log('   • Rotate keys regularly (every 90 days recommended)');
console.log('   • If compromised, generate a new key immediately\n');
