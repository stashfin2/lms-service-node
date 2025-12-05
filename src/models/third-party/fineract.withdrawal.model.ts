
import { IWithdrawalPayload, IWithdrawalSuccessResponse } from "../../schema/fineract.withdrawal.interface.js";
import { logger } from "../../utils/logger";

export class FineractWithdrawalRequestModel {
  locale!: string
  dateFormat!: string
  transactionDate!: string
  transactionAmount!: number
  paymentTypeId!: string
  routingCode!: string
  receiptNumber!: string
  datatables?: Array<{
    registeredTableName: string;
    data: Record<string, any>;
  }>;

  constructor(payload: IWithdrawalPayload) {
    this.validatePayload(payload);
    this.locale = payload.locale;
    this.dateFormat = payload.dateFormat;
    this.transactionDate = payload.transactionDate;
    this.transactionAmount = payload.transactionAmount;
    this.paymentTypeId = payload.paymentTypeId;
    this.routingCode = payload.routingCode;
    this.receiptNumber = payload.receiptNumber;
    
  }

  private validatePayload(payload: IWithdrawalPayload): void {
    const requiredStringFields: Array<keyof IWithdrawalPayload> = [
        'locale',
        'dateFormat',
        'transactionDate',
        'paymentTypeId',
        'routingCode',
        'receiptNumber',
    ];
    requiredStringFields.forEach((field) => {
        if (typeof payload[field] !== 'string' || (payload[field] as string).trim() === '') {
            logger.error(`Invalid or missing field: ${field}`);
            throw new Error(`Invalid or missing field: ${field}`);
        }
    });
  }
}

export class FineractWithdrawalResponse {
    officeId: number;
    clientId: number;
    savingsId: number;
    resourceId: number;
    changes?: {
        paymentTypeId: number
    }
    constructor(response: IWithdrawalSuccessResponse) {
      this.officeId = response.officeId;
      this.clientId = response.clientId;
      this.savingsId = response.savingsId;
      this.resourceId = response.resourceId;
      this.changes = response.changes;
    }
  }
