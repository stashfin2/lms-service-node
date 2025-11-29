
import { IClientPayload, IClientSuccessResponse } from "../../schema/fineract.client.interface.js";

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