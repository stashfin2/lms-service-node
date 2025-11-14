import * as dotenv from 'dotenv';

dotenv.config();

export const fineractConfig = {
  baseUrl: process.env.FINERACT_BASE_URL || 'https://localhost:8443/fineract-provider',
  apiKey: process.env.FINERACT_API_KEY || '',
  tenantId: process.env.FINERACT_TENANT_ID || 'default',
  
  // Additional Fineract-specific configurations
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

