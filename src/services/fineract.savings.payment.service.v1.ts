import { injectable, inject } from 'tsyringe';
import { logger } from '../utils/logger';
import { FineractApiClient, IThirdPartyClient } from '../integrations';
import { fineractConfig, fineractSavingsAccountConfig } from '../config/fineract.config';
import { PaymentPayload } from '../kafka';
import { SavingsAccount } from '../models/database-models/savingsAccount';
import { SavingsDatabaseServiceV1 } from '../database/fineract.savings.database.service.v1';
import { PaymentDatabaseServiceV1 } from '../database/payment.database.service.v1';
import { formatToReadableDate } from '../utils/dateFormatter';
import { SavingsAccountPayment } from '../models/database-models/SavingsAccountPayment';
import { FineractSavingsDepositRequest, FineractSavingsDepositResponse } from '../models/third-party/fineract.savings.model';

@injectable()
export class FineractSavingsPaymentService {

    constructor(
        @inject(SavingsDatabaseServiceV1) private savingsAccountDbService: SavingsDatabaseServiceV1,
        @inject(PaymentDatabaseServiceV1) private paymentDbService: PaymentDatabaseServiceV1,
        @inject(FineractApiClient) private thirdPartyClient: IThirdPartyClient
    ) { }

    private validatePaymentPayload(payload: PaymentPayload): void {
        // Required fields
        if (!payload.paymentId) {
            throw new Error('Missing required field: paymentId');
        }
        if (!payload.loanId) {
            throw new Error('Missing required field: loanId');
        }
        if (!payload.customerId) {
            throw new Error('Missing required field: customerId');
        }
        if (payload.amount === undefined || payload.amount === null) {
            throw new Error('Missing required field: amount');
        }
        if (typeof payload.amount !== 'number' || payload.amount <= 0) {
            throw new Error('Invalid amount: must be a positive number');
        }
        if (!payload.paymentStatus) {
            throw new Error('Missing required field: paymentStatus');
        }
    }

    public async recordPayment(payload: PaymentPayload): Promise<void> {
        try {
            logger.info('Starting payment recording process', {
                paymentId: payload.paymentId,
                loanId: payload.loanId,
                customerId: payload.customerId,
                amount: payload.amount,
            });

            //validate payload
            this.validatePaymentPayload(payload);
            logger.debug('Payment payload validation passed', {
                paymentId: payload.paymentId,
                loanId: payload.loanId,
            });

            //call savingsAccountDbService to get savingsAccount by loanId
            const savingsAccount: SavingsAccount | null = await this.savingsAccountDbService.getSavingsAccountByExternalId(
                String(payload.loanId)
            );

            if (!savingsAccount || !savingsAccount.savingsAccountId) {
                logger.error('Savings account not found', {
                    loanId: payload.loanId,
                    customerId: payload.customerId,
                });
                throw new Error(`Savings account not found for loanId: ${payload.loanId}`);
            }

            logger.info('Savings account found', {
                loanId: payload.loanId,
                savingsAccountId: savingsAccount.savingsAccountId,
                customerId: payload.customerId,
            });

            //call thirdPartyClient to record payment
            const transactionDate = formatToReadableDate(new Date());
            const fineractDepositRequest = new FineractSavingsDepositRequest({
                transactionDate: transactionDate,
                transactionAmount: payload.amount,
                dateFormat: fineractSavingsAccountConfig.dateFormat,
                locale: fineractSavingsAccountConfig.locale,
                receiptNumber: String(payload.paymentId),
                note: `Payment for loan ${payload.loanId}`,
            });

            logger.info('Building Fineract deposit transaction request', {
                savingsAccountId: savingsAccount.savingsAccountId,
                amount: payload.amount,
                paymentId: payload.paymentId,
            });

            const fineractResponse = new FineractSavingsDepositResponse(
                await this.thirdPartyClient.post<FineractSavingsDepositResponse>(
                    `/api/v1/savingsaccounts/${savingsAccount.savingsAccountId}/transactions?command=deposit`,
                    fineractDepositRequest,
                    {
                        headers: {
                            'Fineract-Platform-TenantId': fineractConfig.tenantId,
                        },
                    },
                    String(payload.customerId)
                )
            );

            const transactionId = fineractResponse?.transactionId ?? fineractResponse?.resourceId ?? fineractResponse?.savingsId;

            logger.info('Fineract deposit transaction recorded successfully', {
                paymentId: payload.paymentId,
                loanId: payload.loanId,
                savingsAccountId: savingsAccount.savingsAccountId,
                transactionId: transactionId,
            });

            //store in db as payment with paymentId, loanId, customerId, amount, paymentStatus
            const payment: SavingsAccountPayment = {
                paymentId: payload.paymentId,
                loanId: payload.loanId,
                customerId: payload.customerId,
                savingsAccountId: savingsAccount.savingsAccountId,
                amount: payload.amount,
                paymentStatus: payload.paymentStatus,
                transactionId: transactionId,
                metadata: payload.metadata,
            };

            await this.paymentDbService.createOrUpdateSavingsAccountPayment(payment);

            logger.info('Payment recorded successfully in database', {
                paymentId: payload.paymentId,
                loanId: payload.loanId,
                customerId: payload.customerId,
            });

        } catch (error: any) {
            logger.error('Error recording payment', {
                paymentId: payload.paymentId,
                loanId: payload.loanId,
                customerId: payload.customerId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to record payment for paymentId: ${payload.paymentId}. ${error.message}`);
        }
    }

}
