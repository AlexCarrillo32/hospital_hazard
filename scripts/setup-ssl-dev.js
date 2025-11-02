#!/usr/bin/env node

/**
 * Generate self-signed SSL certificates for development
 *
 * WARNING: DO NOT use self-signed certificates in production!
 * For production, obtain certificates from a trusted CA:
 * - Let's Encrypt (free, automated)
 * - DigiCert, GlobalSign, Sectigo (commercial)
 * - Your organization's internal CA
 *
 * Usage:
 *   node scripts/setup-ssl-dev.js
 *   npm run setup-ssl-dev
 */

import { generateSelfSignedCert } from '../src/config/ssl.js';

console.log('🔒 Setting up SSL/TLS for Development\n');
console.log('⚠️  WARNING: This generates SELF-SIGNED certificates');
console.log('⚠️  NEVER use these in production!\n');

try {
  const result = await generateSelfSignedCert();

  console.log('✅ Self-signed certificates generated successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📋 ADD THIS TO YOUR .env FILE:\n');
  console.log('SSL_ENABLED=true');
  console.log(`SSL_CERT_PATH=${result.certPath}`);
  console.log(`SSL_KEY_PATH=${result.keyPath}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('🚀 To start with HTTPS:');
  console.log('   1. Update your .env file with the above configuration');
  console.log('   2. Run: npm start');
  console.log('   3. Access: https://localhost:3000\n');
  console.log('⚠️  Your browser will show a security warning (expected)');
  console.log('   Click "Advanced" → "Proceed to localhost (unsafe)"\n');
  console.log("📝 For production, use real certificates from Let's Encrypt:");
  console.log('   See: docs/SSL_SETUP.md\n');
} catch (error) {
  console.error('❌ Failed to generate certificates:', error.message);
  process.exit(1);
}
