import * as dotenv from 'dotenv';

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
