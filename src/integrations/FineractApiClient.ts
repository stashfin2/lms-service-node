/**
 * Fineract API Client
 * Handles all third-party API calls to Fineract
 */

import { injectable } from 'tsyringe';
import { BaseThirdPartyClient } from './BaseThirdPartyClient';
import { fineractConfig } from '../config/fineract.config';

@injectable()
export class FineractApiClient extends BaseThirdPartyClient {

  constructor() {
    super(
      fineractConfig.baseUrl,
      fineractConfig.timeout,
      fineractConfig.retryAttempts,
      {
        'Fineract-Platform-TenantId': fineractConfig.tenantId,
        'Authorization': fineractConfig.basicAuth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    );
  }

}
