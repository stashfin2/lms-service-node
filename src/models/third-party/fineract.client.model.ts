
import { IClientPayload, IClientSuccessResponse } from "../../schema/fineract.client.interface.js";
import { logger } from "../../utils/logger";

export class FineractCreateClientRequest {
  officeId!: number;
  firstname!: string;
  lastname!: string;
  externalId!: string;
  active!: boolean;
  activationDate!: string;
  submittedOnDate!: string;
  mobileNo!: string;
  emailAddress!: string;
  dateFormat!: string;
  locale!: string;
  savingsProductId!: number;
  datatables?: Array<{
    registeredTableName: string;
    data: Record<string, any>;
  }>;

  constructor(payload: IClientPayload) {
    this.validatePayload(payload);

    this.officeId = payload.officeId;
    this.firstname = payload.firstname;
    this.lastname = payload.lastname;
    this.externalId = payload.externalId;
    this.active = payload.active;
    this.activationDate = payload.activationDate;
    this.submittedOnDate = payload.submittedOnDate;
    this.mobileNo = payload.mobileNo;
    this.emailAddress = payload.emailAddress;
    this.dateFormat = payload.dateFormat;
    this.locale = payload.locale;
    this.savingsProductId = payload.savingsProductId;

    // Convert family members → datatables format
    this.datatables = [
      {
        registeredTableName: "Family Details",
        data: {
          locale: "en",
          "Number of members": payload.familyMembers.length,
          "Date of verification": payload.submittedOnDate,
          dateFormat: payload.dateFormat
        }
      }
    ];
  }

  private validatePayload(payload: IClientPayload): void {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.emailAddress)) {
      throw new Error(`Invalid email format: ${payload.emailAddress}`);
    }

    const mobileRegex = /^\+?[\d\s-()]+$/;
    if (!mobileRegex.test(payload.mobileNo)) {
      throw new Error(`Invalid mobile number format: ${payload.mobileNo}`);
    }

    if (!payload.officeId || payload.officeId <= 0) {
      throw new Error('Invalid officeId: must be a positive number');
    }

    if (!payload.savingsProductId || payload.savingsProductId <= 0) {
      throw new Error('Invalid savingsProductId: must be a positive number');
    }

    if (!payload.activationDate || !payload.submittedOnDate || !payload.dateOfBirth) {
      throw new Error('Missing required date fields: activationDate, submittedOnDate, or dateOfBirth');
    }

    logger.debug('Client payload validation passed', {
      externalId: payload.externalId,
    });
  }
}

export class FineractCreateClientResponse {
  officeId: number;
  clientId: number;
  savingsId: number;
  resourceId: number;
  resourceExternalId: string;

  constructor(response: IClientSuccessResponse) {
    this.officeId = response.officeId;
    this.clientId = response.clientId;
    this.savingsId = response.savingsId;
    this.resourceId = response.resourceId;
    this.resourceExternalId = response.resourceExternalId;
  }
}