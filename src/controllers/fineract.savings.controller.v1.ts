import { injectable, inject } from 'tsyringe';
import { FineractSavingsService } from '../services/fineract.savings.service.v1';
import { SavingAccountPayload } from '../kafka';
import { IWithdrawalPayload} from '../schema/fineract.withdrawal.interface';

@injectable()
export class FineractSavingsControllerV1 {   
  constructor(
    @inject(FineractSavingsService) private fineractService: FineractSavingsService
  ) {}

  public async createAndAprroveAndActivateSavingsAccount(payload: SavingAccountPayload): Promise<void> {  
    return this.fineractService.createAndAprroveAndActivateSavingsAccount(payload);
  }

  public async withdrawFromSavingsAccount(payload:IWithdrawalPayload): Promise<void> {
    // return this.fineractService.withdrawFromSavingsAccount();
  }
}

