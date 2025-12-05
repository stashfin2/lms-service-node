import { injectable, inject } from 'tsyringe';
import { DirectoryDatabaseConnector } from '../connector/sql';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { logger } from '../utils/logger';
import { SavingsAccount, SavingsAccountModel } from '../models/database-models/savingsAccount';


@injectable()
export class SavingsRepository {
    private pool: Pool;

    constructor(
        @inject(DirectoryDatabaseConnector) private dbConnector: DirectoryDatabaseConnector
    ) {
        this.pool = dbConnector.getPool();
    }

    public async getSavingsAccountByExternalId(externalId: string): Promise<SavingsAccount | null> {
        try {
            const [rows] = await this.pool.query<SavingsAccountModel[]>(
                'SELECT * FROM fineract_savings_account WHERE externalId = ? AND (isDeleted = false OR isDeleted IS NULL)',
                [externalId]
            );
            return rows[0] as SavingsAccount | null;
        } catch (error: any) {
            logger.error('Error getting Savings Account by external ID', {
                externalId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to get Savings Account by external ID: ${externalId}. ${error.message}`);
        }
    }

    public async deleteSavingsAccount(savingsAccountId: string): Promise<void> {
        try {
            const now = new Date();
            await this.pool.query(
                'UPDATE fineract_savings_account SET isDeleted = true, updateDate = ? WHERE id = ?',
                [now, savingsAccountId]
            );
        } catch (error: any) {
            logger.error('Error soft deleting savings account', {
                savingsAccountId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to soft delete savings account: ${savingsAccountId}. ${error.message}`);
        }
    }

    public async listSavingsAccounts(): Promise<SavingsAccount[]> {
        try {
            const [rows] = await this.pool.query<SavingsAccountModel[]>(
                'SELECT * FROM fineract_savings_account WHERE isDeleted = false OR isDeleted IS NULL'
            );
            return rows as SavingsAccount[];
        } catch (error: any) {
            logger.error('Error listing savings accounts', {
                operation: 'listSavingsAccounts',
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to list savings accounts. ${error.message}`);
        }
    }

    public async createSavingsAccount(savingsAccount: SavingsAccount): Promise<number> {
        try {
            // Validate required fields
            if (!savingsAccount.externalId) {
                throw new Error('externalId is required');
            }

            const now = new Date();
            const [result] = await this.pool.query<ResultSetHeader>(
                `INSERT INTO fineract_savings_account (
          id, externalId, customerId, loanId, clientId, 
          savingsAccountId, productId, overdraftLimit, submittedOnDate, 
          dateFormat, locale, charges, isDeleted, createDate, updateDate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          customerId = COALESCE(VALUES(customerId), customerId),
          loanId = COALESCE(VALUES(loanId), loanId),
          clientId = COALESCE(VALUES(clientId), clientId),
          savingsAccountId = COALESCE(VALUES(savingsAccountId), savingsAccountId),
          productId = COALESCE(VALUES(productId), productId),
          overdraftLimit = COALESCE(VALUES(overdraftLimit), overdraftLimit),
          submittedOnDate = COALESCE(VALUES(submittedOnDate), submittedOnDate),
          dateFormat = COALESCE(VALUES(dateFormat), dateFormat),
          locale = COALESCE(VALUES(locale), locale),
          charges = COALESCE(VALUES(charges), charges),
          isDeleted = COALESCE(VALUES(isDeleted), isDeleted),
          updateDate = VALUES(updateDate)
        `,
                [
                    savingsAccount.id ?? null,
                    savingsAccount.externalId,
                    savingsAccount.customerId ?? null,
                    savingsAccount.loanId ?? null,
                    savingsAccount.clientId ?? null,
                    savingsAccount.savingsAccountId ?? null,
                    savingsAccount.productId ?? null,
                    savingsAccount.overdraftLimit ?? null,
                    savingsAccount.submittedOnDate ?? null,
                    savingsAccount.dateFormat ?? null,
                    savingsAccount.locale ?? null,
                    savingsAccount.charges ? JSON.stringify(savingsAccount.charges) : null,
                    savingsAccount.isDeleted ?? false,
                    savingsAccount.createDate ?? now,
                    now,
                ]
            );
            return result.insertId || savingsAccount.id || 0;
        } catch (error: any) {
            logger.error('Error creating/updating savings account', {
                externalId: savingsAccount.externalId,
                savingsAccountId: savingsAccount.id,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to create/update savings account: ${savingsAccount.externalId}. ${error.message}`);
        }
    }

    public async checkSavingsAccountExists(externalId: string): Promise<boolean> {
        try {
            const [rows] = await this.pool.query<(RowDataPacket & { count: number })[]>(
                'SELECT COUNT(*) as count FROM fineract_savings_account WHERE externalId = ? AND (isDeleted = false OR isDeleted IS NULL)',
                [externalId]
            );
            return rows[0].count > 0;
        } catch (error: any) {
            logger.error('Error checking savings account existence', {
                externalId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to check savings account existence: ${externalId}. ${error.message}`);
        }
    }

    public async checkSavingsAccountExistsByLoanId(loanId: string): Promise<boolean> {
        try {
            const [rows] = await this.pool.query<(RowDataPacket & { count: number })[]>(
                'SELECT COUNT(*) as count FROM fineract_savings_account WHERE loanId = ? AND (isDeleted = false OR isDeleted IS NULL)',
                [loanId]
            );
            return rows[0].count > 0;
        } catch (error: any) {
            logger.error('Error while checking savings account using loanId', {
                loanId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to check savings account existence using loanId: ${loanId}. ${error.message}`);
        }
    }


}

