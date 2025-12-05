import { ISavingsPayload, ISavingsSuccessResponse, IChargeData } from "../../schema/fineract.savings.interface.js";

export class ChargeData {
    chargeId!: number;
    amount!: number;
    dueDate!: string;

    constructor(data: IChargeData) {
        this.chargeId = data.chargeId;
        this.amount = data.amount;
    }
}

export class FineractCreateSavingsRequest {
    productId!: number;
    submittedOnDate!: string;
    externalId!: string;
    overdraftLimit?: number;
    charges?: ChargeData[];
    dateFormat!: string;
    locale!: string;
    clientId!: number;

    constructor(payload: ISavingsPayload) {
        this.productId = payload.productId;
        this.submittedOnDate = payload.submittedOnDate;
        this.externalId = payload.externalId;
        this.overdraftLimit = payload.overdraftLimit;
        this.dateFormat = payload.dateFormat;
        this.locale = payload.locale;
        this.clientId = payload.clientId;

        // Convert charges array if provided
        if (payload.charges && payload.charges.length > 0) {
            this.charges = payload.charges.map(charge => new ChargeData(charge));
        }
    }
}

export class FineractCreateSavingsRequestBuilder {
    private productId?: number;
    private submittedOnDate?: string;
    private externalId?: string;
    private overdraftLimit?: number;
    private charges?: IChargeData[];
    private dateFormat?: string;
    private locale?: string;
    private clientId?: number;

    withProductId(productId: number): this {
        this.productId = productId;
        return this;
    }

    withSubmittedOnDate(submittedOnDate: string): this {
        this.submittedOnDate = submittedOnDate;
        return this;
    }

    withExternalId(externalId: string): this {
        this.externalId = externalId;
        return this;
    }

    withOverdraftLimit(overdraftLimit: number): this {
        this.overdraftLimit = overdraftLimit;
        return this;
    }

    withCharges(charges: IChargeData[]): this {
        this.charges = charges;
        return this;
    }

    withCharge(charge: IChargeData): this {
        if (!this.charges) {
            this.charges = [];
        }
        this.charges.push(charge);
        return this;
    }

    withDateFormat(dateFormat: string): this {
        this.dateFormat = dateFormat;
        return this;
    }

    withLocale(locale: string): this {
        this.locale = locale;
        return this;
    }

    withClientId(clientId: number): this {
        this.clientId = clientId;
        return this;
    }

    build(): FineractCreateSavingsRequest {
        if (!this.productId) {
            throw new Error('productId is required');
        }
        if (!this.submittedOnDate) {
            throw new Error('submittedOnDate is required');
        }
        if (!this.externalId) {
            throw new Error('externalId is required');
        }
        if (!this.dateFormat) {
            throw new Error('dateFormat is required');
        }
        if (!this.locale) {
            throw new Error('locale is required');
        }
        if (!this.clientId) {
            throw new Error('clientId is required');
        }

        const payload: ISavingsPayload = {
            productId: this.productId,
            submittedOnDate: this.submittedOnDate,
            externalId: this.externalId,
            dateFormat: this.dateFormat,
            locale: this.locale,
            clientId: this.clientId,
        };

        if (this.overdraftLimit !== undefined) {
            payload.overdraftLimit = this.overdraftLimit;
        }

        if (this.charges && this.charges.length > 0) {
            payload.charges = this.charges;
        }

        return new FineractCreateSavingsRequest(payload);
    }

    static create(): FineractCreateSavingsRequestBuilder {
        return new FineractCreateSavingsRequestBuilder();
    }
}

export class FineractCreateSavingsResponse {
    status: string;
    savingsAccountId: number;
    creationStatus: string;
    approvalStatus: string;
    activationStatus: string;
    step: string;
    message: string;

    constructor(response: ISavingsSuccessResponse) {
        this.status = response.status;
        this.savingsAccountId = response.savingsAccountId;
        this.creationStatus = response.creationStatus;
        this.approvalStatus = response.approvalStatus;
        this.activationStatus = response.activationStatus;
        this.step = response.step;
        this.message = response.message;
    }
}

