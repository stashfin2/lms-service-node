/**
 * Fineract API Client
 * Handles all third-party API calls to Fineract
 */

import { injectable } from 'tsyringe';
import { BaseThirdPartyClient } from './BaseThirdPartyClient';
import { fineractConfig } from '../config/fineract.config';

@injectable()
export class FineractApiClient extends BaseThirdPartyClient {
  private apiKey: string;
  private tenantId: string;

  constructor() {
    super(
      fineractConfig.baseUrl,
      fineractConfig.timeout,
      fineractConfig.retryAttempts,
      {
        'Fineract-Platform-TenantId': fineractConfig.tenantId,
        'Authorization': `Basic ${Buffer.from(`${fineractConfig.tenantId}:${fineractConfig.apiKey}`).toString('base64')}`,
      }
    );

    this.apiKey = fineractConfig.apiKey;
    this.tenantId = fineractConfig.tenantId;
  }

}

