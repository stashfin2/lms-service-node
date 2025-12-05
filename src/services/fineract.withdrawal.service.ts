import { injectable, inject } from 'tsyringe';
import { ClientDatabaseServiceV1 } from '../database/fineract.client.database.service.v1';
import { FineractApiClient, IThirdPartyClient } from '../integrations';
import { SavingsDatabaseServiceV1 } from '../database/fineract.savings.database.service.v1';
import { IlmsWithdrawalPayload } from '../schema/fineract.withdrawal.interface';
import { FineractWithdrawalRequestModel, FineractWithdrawalResponse } from '../models/third-party/fineract.withdrawal.model';
import { logger } from '../utils/logger';
import { fineractConfig } from '../config';

@injectable()
export class FineractSavingsService {
    constructor(
        @inject(ClientDatabaseServiceV1) private clientDbService: ClientDatabaseServiceV1,
        @inject(SavingsDatabaseServiceV1) private savingsAccountDbService: SavingsDatabaseServiceV1,
        @inject(FineractApiClient) private thirdPartyClient: IThirdPartyClient

    ) { }

    public async withdrawFromSavingsAccount(payload: IlmsWithdrawalPayload): Promise<void> {
        try {
            // Implement the withdrawal logic here
            // For example, call the third-party API to process the withdrawal
            const {customerId, loanId} = payload;
            logger.info(`Initiating withdrawal for customer ID: ${customerId} and loan ID: ${loanId}`);
            const checkExistence = await this.savingsAccountDbService.checkSavingsAccountExistsByLoanId(`${loanId}`);
            if (!checkExistence) {
                throw new Error(`Savings account for loan ID ${loanId} does not exist.`);
            }

            const fineractWithdrawalRequest = new FineractWithdrawalRequestModel(payload.requestPayload);
            const fineractWithdrawalResponse: FineractWithdrawalResponse = await this.thirdPartyClient.post<FineractWithdrawalResponse>(
                `/api/v1/savingsaccounts/${loanId}/transactions?command=withdrawal`,
                fineractWithdrawalRequest,
                {
                  headers: {
                    'Fineract-Platform-TenantId': fineractConfig.tenantId,
                    'Authorization': fineractConfig.basicAuth,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                },
                `${payload.loanId}`
              );
            logger.info(`Withdrawal successful for customer ID: ${customerId} and loan ID: ${loanId}`, JSON.stringify({response: fineractWithdrawalResponse}))

        }catch (error) {
            logger.error('Error processing withdrawal from savings account', {
                customerId: payload.customerId,
                loanId: payload.loanId,
                error: (error as Error).message,
                stack: (error as Error).stack,
            });
            // Handle error appropriately
            throw error;
        }
    }

}
