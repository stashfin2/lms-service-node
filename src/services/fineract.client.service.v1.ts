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

  public async createClient(payload: IClientPayload): Promise<void> {  
    try {
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
