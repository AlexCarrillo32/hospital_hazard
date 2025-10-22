import { createLogger } from '../utils/logger.js';

const logger = createLogger('waste-classifier');

export async function classifyWaste(_labReportText) {
  logger.info('Classifying waste from lab report');

  throw new Error('Not implemented');
}

export async function generateWasteProfile(_classificationResult) {
  logger.info('Generating EPA waste profile');

  throw new Error('Not implemented');
}
