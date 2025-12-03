import { RowDataPacket } from 'mysql2';
import { ChargeData } from '../third-party/fineract.savings.model';

export interface SavingsAccount {
    id?: number;
    externalId?: string;
    customerId?: string;
    loanId?: string;
    clientId?: number;
    savingsAccountId?: number;
    productId?: number;
    overdraftLimit?: number;
    submittedOnDate?: string;
    dateFormat?: string;
    locale?: string;
    charges?: ChargeData[];
    isDeleted?: boolean;
    createDate?: Date;
    updateDate?: Date;
}

export interface SavingsAccountModel extends RowDataPacket, SavingsAccount { }