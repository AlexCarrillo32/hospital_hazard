import { createLogger } from '../utils/logger.js';

const logger = createLogger('facility-matcher');

export async function findApprovedFacilities(_wasteProfile) {
  logger.info('Finding approved disposal facilities');

  throw new Error('Not implemented');
}

export async function calculateOptimalRoute(_wasteProfile, _facilities) {
  logger.info('Calculating optimal disposal route');

  throw new Error('Not implemented');
}
