
export interface IChargeData {
    chargeId: number;
    amount: number;
}

export interface ISavingsPayload {
    productId: number;
    submittedOnDate: string;
    externalId: string;
    overdraftLimit?: number;
    charges?: IChargeData[];
    dateFormat: string;
    locale: string;
    clientId: number;
}

export interface ISavingsSuccessResponse {
    status: string;
    savingsAccountId: number;
    creationStatus: string;
    approvalStatus: string;
    activationStatus: string;
    step: string;
    message: string;
}

