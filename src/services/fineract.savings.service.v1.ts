import { injectable, inject } from 'tsyringe';
import { IClientPayload } from '../schema/fineract.client.interface';
import { logger } from '../utils/logger';
import { ClientDatabaseServiceV1 } from '../database/fineract.client.database.service.v1';
import { FineractApiClient, IThirdPartyClient } from '../integrations';
import { FineractCreateClientRequest, FineractCreateClientResponse } from '../models/third-party/fineract.client.model';
import { Client } from '../models/database-models';
import { fineractConfig, fineractSavingsAccountConfig } from '../config/fineract.config';
import { ISavingsPayload } from '../schema/fineract.savings.interface';
import { SavingAccountPayload } from '../kafka';
import { FineractCreateSavingsRequest, FineractCreateSavingsRequestBuilder, FineractCreateSavingsResponse } from '../models/third-party/fineract.savings.model';
import { SavingsAccount } from '../models/database-models/savingsAccount';
import { SavingsDatabaseServiceV1 } from '../database/fineract.savings.database.service.v1';

@injectable()
export class FineractSavingsService {
    constructor(
        @inject(ClientDatabaseServiceV1) private clientDbService: ClientDatabaseServiceV1,
        @inject(SavingsDatabaseServiceV1) private savingsAccountDbService: SavingsDatabaseServiceV1,
        @inject(FineractApiClient) private thirdPartyClient: IThirdPartyClient
    ) { }


    private validateSavingsPayload(payload: SavingAccountPayload): void {
        // Required string fields
        const requiredStringFields: Array<keyof SavingAccountPayload> = [
            'loanId',
            'customerId',
            'overdraftLimit',
            'status',
            'createdAt',
        ];

        for (const field of requiredStringFields) {
            const value = payload[field];
            if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                throw new Error(`Missing or empty required field: ${field}`);
            }
        }
    }
    public async createAndAprroveAndActivateSavingsAccount(payload: SavingAccountPayload): Promise<void> {
        try {
            logger.info('Starting savings account creation process', {
                loanId: payload.loanId,
                customerId: payload.customerId,
                overdraftLimit: payload.overdraftLimit,
            });

            //validate payload
            this.validateSavingsPayload(payload);
            logger.debug('Savings account payload validation passed', {
                loanId: payload.loanId,
                customerId: payload.customerId,
            });

            // get clientId by customerId from db
            const client = await this.clientDbService.getClientByExternalId(payload.customerId);
            if (!client || !client.clientId) {
                logger.error('Client not found or clientId is missing', {
                    customerId: payload.customerId,
                    loanId: payload.loanId,
                });
                throw new Error(`Client not found or clientId is missing for customerId: ${payload.customerId}`);
            }
            logger.info('Client found in database', {
                customerId: payload.customerId,
                clientId: client.clientId,
                loanId: payload.loanId,
            });

            //add hardcoded values for productId, dateFormat,locale from config
            const productId = parseInt(fineractSavingsAccountConfig.productId, 10);
            const dateFormat = fineractSavingsAccountConfig.dateFormat;
            const locale = fineractSavingsAccountConfig.locale;
            //add hardcoded values for Charges from config
            const charges = fineractSavingsAccountConfig.charges;

            logger.debug('Building Fineract savings account request', {
                productId,
                clientId: client.clientId,
                externalId: payload.loanId,
                dateFormat,
                locale,
                chargesCount: charges.length,
            });

            const fineractRequest = FineractCreateSavingsRequestBuilder.create()
                .withProductId(productId)
                .withClientId(client.clientId)
                .withExternalId(payload.loanId)
                .withSubmittedOnDate(payload.createdAt.toISOString())
                .withDateFormat(dateFormat)
                .withLocale(locale)
                .withOverdraftLimit(payload.overdraftLimit)
                .withCharges(charges)
                .build();

            logger.info('Fineract savings account request built successfully', {
                loanId: payload.loanId,
                customerId: payload.customerId,
                clientId: client.clientId,
            });

            //call thirdparty to create/approve/activate savings account

            const fineractResponse: FineractCreateSavingsResponse = await this.thirdPartyClient.post<FineractCreateSavingsResponse>(
                '/api/v1/custom/savings/full-create',
                fineractRequest,
                {
                  headers: {
                    'Fineract-Platform-TenantId': fineractConfig.tenantId,
                  },
                },
                payload.customerId
              );

            logger.info('Fineract savings account created successfully', {
                loanId: payload.loanId,
                customerId: payload.customerId,
                clientId: client.clientId,
                savingsId: fineractResponse.savingsAccountId,
            });

            const savingsAccount: SavingsAccount = {
                externalId: payload.loanId,
                customerId: payload.customerId,
                loanId: payload.loanId,
                clientId: client.clientId,
                savingsAccountId: fineractResponse.savingsAccountId,
                productId: productId,
                overdraftLimit: payload.overdraftLimit,
                submittedOnDate: payload.createdAt.toISOString(),
                dateFormat: dateFormat,
                locale: locale,
                charges: charges,
                createDate: new Date(),
                updateDate: new Date(),
            };
            
            await this.savingsAccountDbService.createOrUpdateSavingsAccount(savingsAccount);

            //store in db as savingAccount with savingsId, clientId, productId, submittedOnDate, externalId, overdraftLimit, charges, dateFormat, locale

        } catch (error: any) {
            logger.error('Error creating savings account', {
                loanId: payload.loanId,
                customerId: payload.customerId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to create savings account for loanId: ${payload.loanId}. ${error.message}`);
        }
    };

}
