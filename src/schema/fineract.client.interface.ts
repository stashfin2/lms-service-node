
export interface IClientAddress {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  }
  
export type ClientStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export interface IClientPayload {
  officeId: number;
  legalFormId: number;
  isStaff: boolean;
  active: boolean;
  activationDate: string;
  externalId: string;
  mobileNo: string;
  emailAddress: string;
  dateOfBirth: string;
  submittedOnDate: string;
  firstname: string;
  lastname: string;
  savingsProductId: number;
  familyMembers: any[];
  dateFormat: string;
  locale: string;
  address?: IClientAddress;
}

export interface IClientSuccessResponse {
  officeId: number,
  clientId: number,
  savingsId: number,
  resourceId: number,
  resourceExternalId: string
}


