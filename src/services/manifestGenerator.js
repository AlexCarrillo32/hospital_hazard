import { createLogger } from '../utils/logger.js';

const logger = createLogger('manifest-generator');

export async function createManifest(_wasteProfile, _facility, _route) {
  logger.info('Creating electronic manifest');

  throw new Error('Not implemented');
}

export async function trackManifest(manifestId) {
  logger.info(`Tracking manifest ${manifestId}`);

  throw new Error('Not implemented');
}
