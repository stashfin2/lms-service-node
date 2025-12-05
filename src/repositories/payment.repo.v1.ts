import { injectable, inject } from 'tsyringe';
import { DirectoryDatabaseConnector } from '../connector/sql';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { logger } from '../utils/logger';
import { SavingsAccountPayment, SavingsAccountPaymentModel } from '../models/database-models/SavingsAccountPayment';

@injectable()
export class PaymentRepository {
    private pool: Pool;

    constructor(
        @inject(DirectoryDatabaseConnector) private dbConnector: DirectoryDatabaseConnector
    ) {
        this.pool = dbConnector.getPool();
    }

    public async createOrUpdateSavingsAccountPayment(payment: SavingsAccountPayment): Promise<number> {
        try {
            const now = new Date();
            const [result] = await this.pool.query<ResultSetHeader>(
                `INSERT INTO savings_account_repayment 
                (paymentId, loanId, customerId, savingsAccountId, amount, paymentStatus, transactionId, metadata, createDate, updateDate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    loanId = VALUES(loanId),
                    customerId = VALUES(customerId),
                    savingsAccountId = VALUES(savingsAccountId),
                    amount = VALUES(amount),
                    paymentStatus = VALUES(paymentStatus),
                    transactionId = VALUES(transactionId),
                    metadata = VALUES(metadata),
                    updateDate = VALUES(updateDate)`,
                [
                    payment.paymentId,
                    payment.loanId,
                    payment.customerId,
                    payment.savingsAccountId || null,
                    payment.amount,
                    payment.paymentStatus,
                    payment.transactionId || null,
                    payment.metadata ? JSON.stringify(payment.metadata) : null,
                    now,
                    now
                ]
            );
            return result.insertId;
        } catch (error: any) {
            logger.error('Error creating payment', {
                paymentId: payment.paymentId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to create payment: ${payment.paymentId}. ${error.message}`);
        }
    }

    public async getPaymentByPaymentId(paymentId: string | number): Promise<SavingsAccountPayment | null> {
        try {
            const [rows] = await this.pool.query<SavingsAccountPaymentModel[]>(
                'SELECT * FROM payments WHERE paymentId = ?',
                [paymentId]
            );
            return rows[0] as SavingsAccountPayment | null;
        } catch (error: any) {
            logger.error('Error getting payment by payment ID', {
                paymentId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to get payment by payment ID: ${paymentId}. ${error.message}`);
        }
    }
}

