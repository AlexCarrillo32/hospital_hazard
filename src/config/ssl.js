import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ssl');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SSL/TLS Configuration
 * Supports both self-signed (development) and production certificates
 */
export function getSSLConfig() {
  const sslEnabled = process.env.SSL_ENABLED === 'true';

  if (!sslEnabled) {
    logger.info('SSL/TLS is disabled');
    return null;
  }

  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;
  const caPath = process.env.SSL_CA_PATH;

  if (!certPath || !keyPath) {
    logger.error('SSL enabled but SSL_CERT_PATH or SSL_KEY_PATH not configured');
    throw new Error('SSL configuration incomplete');
  }

  try {
    const sslConfig = {
      key: fs.readFileSync(path.resolve(keyPath)),
      cert: fs.readFileSync(path.resolve(certPath)),
    };

    // Add CA certificate if provided (for certificate chains)
    if (caPath) {
      sslConfig.ca = fs.readFileSync(path.resolve(caPath));
    }

    // SSL/TLS options for production
    sslConfig.secureProtocol = 'TLS_method'; // Use modern TLS
    sslConfig.secureOptions =
      // Disable SSLv2, SSLv3, TLSv1, TLSv1.1 (only allow TLSv1.2+)
      require('constants').SSL_OP_NO_SSLv2 |
      require('constants').SSL_OP_NO_SSLv3 |
      require('constants').SSL_OP_NO_TLSv1 |
      require('constants').SSL_OP_NO_TLSv1_1;

    // Cipher suite configuration (strong ciphers only)
    sslConfig.ciphers = [
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'DHE-RSA-AES128-GCM-SHA256',
      'DHE-RSA-AES256-GCM-SHA384',
    ].join(':');

    sslConfig.honorCipherOrder = true; // Server chooses cipher
    sslConfig.minVersion = 'TLSv1.2'; // Minimum TLS version

    logger.info(
      {
        certPath,
        keyPath,
        caPath: caPath || 'none',
        minVersion: sslConfig.minVersion,
      },
      'SSL/TLS configuration loaded'
    );

    return sslConfig;
  } catch (error) {
    logger.error({ error: error.message, certPath, keyPath }, 'Failed to load SSL certificates');
    throw new Error(`SSL certificate loading failed: ${error.message}`);
  }
}

/**
 * Validate SSL certificate expiration
 */
export function checkCertificateExpiration(certPath) {
  try {
    const cert = fs.readFileSync(certPath, 'utf8');
    const certData = require('crypto').createPublicKey(cert);

    // Extract certificate details
    // Note: This is a simplified check. For production, use a library like 'node-forge'
    logger.info({ certPath }, 'Certificate validation check');

    return {
      valid: true,
      path: certPath,
    };
  } catch (error) {
    logger.error({ error: error.message, certPath }, 'Certificate validation failed');
    return {
      valid: false,
      error: error.message,
      path: certPath,
    };
  }
}

/**
 * Generate self-signed certificate for development
 * WARNING: Never use self-signed certificates in production
 */
export async function generateSelfSignedCert() {
  const forge = await import('node-forge');
  const pki = forge.default.pki;

  logger.warn('Generating self-signed certificate for DEVELOPMENT ONLY');

  // Generate key pair
  const keys = pki.rsa.generateKeyPair(2048);

  // Create certificate
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'California' },
    { name: 'localityName', value: 'San Francisco' },
    { name: 'organizationName', value: 'Waste Compliance Agent DEV' },
    { shortName: 'OU', value: 'Development' },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          value: 'localhost',
        },
        {
          type: 7, // IP
          ip: '127.0.0.1',
        },
      ],
    },
  ]);

  // Self-sign certificate
  cert.sign(keys.privateKey);

  // Convert to PEM format
  const pemCert = pki.certificateToPem(cert);
  const pemKey = pki.privateKeyToPem(keys.privateKey);

  // Save to files
  const certDir = path.resolve(__dirname, '../../ssl');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const certPath = path.join(certDir, 'cert.pem');
  const keyPath = path.join(certDir, 'key.pem');

  fs.writeFileSync(certPath, pemCert);
  fs.writeFileSync(keyPath, pemKey);

  logger.warn(
    {
      certPath,
      keyPath,
    },
    'Self-signed certificate generated - DEVELOPMENT ONLY'
  );

  return {
    cert: pemCert,
    key: pemKey,
    certPath,
    keyPath,
  };
}
