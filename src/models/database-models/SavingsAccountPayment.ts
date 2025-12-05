import { RowDataPacket } from 'mysql2';

export interface SavingsAccountPayment {
    id?: number;
    paymentId: string | number;
    loanId: string | number;
    customerId: string | number;
    savingsAccountId?: number;
    amount: number;
    paymentStatus: string;
    transactionId?: number; // Fineract transaction ID
    metadata?: Record<string, any>;
    createDate?: Date;
    updateDate?: Date;
}

export interface SavingsAccountPaymentModel extends RowDataPacket, SavingsAccountPayment { }

