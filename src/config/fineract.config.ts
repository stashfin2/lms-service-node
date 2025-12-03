import * as dotenv from 'dotenv';
import { IChargeData } from '../schema/fineract.savings.interface';

dotenv.config();

export const fineractConfig = {
  baseUrl: process.env.FINERACT_BASE_URL || 'http://13.201.18.237/fineract-provider',
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
 * Format current date to "dd MMMM yyyy" format (e.g., "3 November 2025")
 */
function getCurrentDateFormatted(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Parse charges from environment variable
 * Expected format: JSON array string, e.g., '[{"chargeId":2,"amount":1000}]'
 * Note: dueDate will be automatically set to current date in "dd MMMM yyyy" format
 * Supports both quoted and unquoted JSON strings
 */
function parseChargesFromEnv(): IChargeData[] {
  const chargesEnv = process.env.FINERACT_SAVINGS_ACCOUNT_CHARGES;
  const currentDate = getCurrentDateFormatted();

  if (!chargesEnv) {
    // Default charges if not provided
    return [
      {
        chargeId: 1,
        amount: 1000,
        dueDate: currentDate,
      },
    ];
  }

  try {
    // Remove surrounding quotes if present (dotenv may include them)
    const cleanedEnv = chargesEnv.trim().replace(/^['"]|['"]$/g, '');
    const parsed = JSON.parse(cleanedEnv);
    if (Array.isArray(parsed)) {
      // Set dueDate to current date for each charge
      return (parsed as IChargeData[]).map(charge => ({
        ...charge,
        dueDate: currentDate,
      }));
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

