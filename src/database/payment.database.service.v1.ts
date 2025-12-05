import { inject, injectable } from 'tsyringe';
import { PaymentRepository } from '../repositories/payment.repo.v1';
import { SavingsAccountPayment } from '../models/database-models/SavingsAccountPayment';

@injectable()
export class PaymentDatabaseServiceV1 {
    constructor(
        @inject(PaymentRepository) private paymentRepo: PaymentRepository
    ) { }

    public async createOrUpdateSavingsAccountPayment(payment: SavingsAccountPayment): Promise<number> {
        return await this.paymentRepo.createOrUpdateSavingsAccountPayment(payment);
    }

    public async getPaymentByPaymentId(paymentId: string | number): Promise<SavingsAccountPayment | null> {
        return await this.paymentRepo.getPaymentByPaymentId(paymentId);
    }
}

