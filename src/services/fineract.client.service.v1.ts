import { injectable, inject } from 'tsyringe';
import { IClientPayload } from '../schema/fineract.client.interface';
import { logger } from '../utils/logger';
import { ClientDatabaseServiceV1 } from '../database/fineract.client.database.service.v1';
import { FineractApiClient, IThirdPartyClient } from '../integrations';
import { FineractCreateClientRequest, FineractCreateClientResponse } from '../models/third-party/fineract.client.model';
import { Client } from '../models/database-models';
import { fineractConfig } from '../config/fineract.config';

@injectable()
export class FineractClientService {   
  constructor(
    @inject(ClientDatabaseServiceV1) private clientDbService: ClientDatabaseServiceV1,
    @inject(FineractApiClient) private thirdPartyClient: IThirdPartyClient
  ) {}

  /**
   * Validates the client payload before creating
   * @throws Error if validation fails
   */
  private validateClientPayload(payload: IClientPayload): void {
    // Required string fields
    const requiredStringFields: Array<keyof IClientPayload> = [
      'externalId',
      'firstname',
      'lastname',
      'mobileNo',
      'emailAddress',
    ];

    for (const field of requiredStringFields) {
      const value = payload[field];
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        throw new Error(`Missing or empty required field: ${field}`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.emailAddress)) {
      throw new Error(`Invalid email format: ${payload.emailAddress}`);
    }

    // Validate mobile number (basic check)
    const mobileRegex = /^\+?[\d\s-()]+$/;
    if (!mobileRegex.test(payload.mobileNo)) {
      throw new Error(`Invalid mobile number format: ${payload.mobileNo}`);
    }

    // Validate required numeric fields
    if (!payload.officeId || payload.officeId <= 0) {
      throw new Error('Invalid officeId: must be a positive number');
    }

    if (!payload.savingsProductId || payload.savingsProductId <= 0) {
      throw new Error('Invalid savingsProductId: must be a positive number');
    }

    // Validate date fields are provided
    if (!payload.activationDate || !payload.submittedOnDate || !payload.dateOfBirth) {
      throw new Error('Missing required date fields: activationDate, submittedOnDate, or dateOfBirth');
    }

    logger.debug('Client payload validation passed', {
      externalId: payload.externalId,
    });
  }

  public async createClient(payload: IClientPayload): Promise<void> {  
    try {
      // Validate input payload
      this.validateClientPayload(payload);

      // Check if client already exists in database
      const existingClient = await this.clientDbService.getClientByExternalId(payload.externalId);
      if (existingClient) {
        logger.info('Client already exists in database', {
          resourceExternalId: payload.externalId,
        });
        return;
      }

      // Create Fineract API request
      const fineractRequest = new FineractCreateClientRequest(payload);

      // Call Fineract API directly using BaseThirdPartyClient methods
      // FineractApiClient is injected for configuration (base URL, auth headers)
      // but we use base class methods directly for flexibility
      const fineractResponse: FineractCreateClientResponse = await this.thirdPartyClient.post<FineractCreateClientResponse>(
        '/api/v1/clients',
        fineractRequest,
        {
          headers: {
            'Fineract-Platform-TenantId': fineractConfig.tenantId,
          },
        },
        payload.externalId
      );

      // Save client response to database
      const clientData: Client = {
        officeId: fineractResponse.officeId,
        clientId: fineractResponse.clientId,
        savingsId: fineractResponse.savingsId,
        resourceId: fineractResponse.resourceId,
        resourceExternalId: fineractResponse.resourceExternalId,
        status: 'active',
        createDate: new Date(),
        updateDate: new Date(),
      };

      await this.clientDbService.createOrUpdateClient(clientData);

      logger.info('Client created successfully', {
        resourceExternalId: payload.externalId,
        resourceId: fineractResponse.resourceId,
        clientId: fineractResponse.clientId,
      });

    } catch (error: any) {
      logger.error('Error creating client', {
        resourceExternalId: payload.externalId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to create client: ${payload.externalId}. ${error.message}`);
    }
  }
}
