
export interface IlmsWithdrawalPayload {
    customerId: string,
    loanId: number,
    requestPayload: IWithdrawalPayload
}

export interface IWithdrawalPayload {
    locale: string,
    dateFormat: string,
    transactionDate: string,
    transactionAmount: number,
    paymentTypeId: string,
    routingCode: string,
    receiptNumber: string
}

export interface IWithdrawalSuccessResponse {
    officeId: number,
    clientId: number,
    savingsId: number,
    resourceId: number,
    changes: {
        paymentTypeId: number
    }
}
