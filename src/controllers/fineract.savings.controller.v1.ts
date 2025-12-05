import { injectable, inject } from 'tsyringe';
import { FineractSavingsService } from '../services/fineract.savings.service.v1';
import { PaymentPayload, SavingAccountPayload } from '../kafka';
import { FineractSavingsPaymentService } from '../services/fineract.savings.payment.service.v1';

@injectable()
export class FineractSavingsControllerV1 {  
  constructor(
    @inject(FineractSavingsService) private fineractService: FineractSavingsService,
    @inject(FineractSavingsPaymentService) private paymentService: FineractSavingsPaymentService
  ) {}

  public async createAndAprroveAndActivateSavingsAccount(payload: SavingAccountPayload): Promise<void> {  
    return this.fineractService.createAndAprroveAndActivateSavingsAccount(payload);
  }
  public async recordPayment(payload: PaymentPayload): Promise<void> {  
    return this.paymentService.recordPayment(payload);
  }
}

