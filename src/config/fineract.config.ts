import * as dotenv from 'dotenv';
import { IChargeData } from '../schema/fineract.savings.interface';

dotenv.config();

export const fineractConfig = {
  baseUrl: process.env.FINERACT_BASE_URL || 'https://localhost:8443/fineract-provider',
  tenantId: 'default',
  username: process.env.FINERACT_USERNAME || 'mifos',
  password: process.env.FINERACT_PASSWORD || 'password',

  get basicAuth() {
    return (
      'Basic ' +
      Buffer.from(`${this.username}:${this.password}`).toString('base64')
    );
  },

  // Additional Fineract-specific configurations
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

/**
 * Parse charges from environment variable
 * Expected format: JSON array string, e.g., '[{"chargeId":2,"amount":1000}]'
 * Supports both quoted and unquoted JSON strings
 */
function parseChargesFromEnv(): IChargeData[] {
  const chargesEnv = process.env.FINERACT_SAVINGS_ACCOUNT_CHARGES;

  if (!chargesEnv) {
    return [];
  }

  try {
    // Remove surrounding quotes if present (dotenv may include them)
    const cleanedEnv = chargesEnv.trim().replace(/^['"]|['"]$/g, '');
    const parsed = JSON.parse(cleanedEnv);
    if (Array.isArray(parsed)) {
      return parsed as IChargeData[];
    }
    throw new Error('FINERACT_SAVINGS_ACCOUNT_CHARGES must be a JSON array');
  } catch (error) {
    throw new Error(`Invalid FINERACT_SAVINGS_ACCOUNT_CHARGES format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const fineractSavingsAccountConfig = {
  productId: (process.env.FINERACT_LAMF_PRODUCT_ID || '1'),
  dateFormat: process.env.FINERACT_DATE_FORMAT || 'dd MMMM yyyy',
  locale: process.env.FINERACT_LOCALE || 'en',
  charges: parseChargesFromEnv(),
};

