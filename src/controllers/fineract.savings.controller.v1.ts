import { injectable, inject } from 'tsyringe';
import { FineractClientService } from '../services/fineract.client.service.v1';
import { IClientPayload } from '../schema/fineract.client.interface';
import { FineractSavingsService } from '../services/fineract.savings.service.v1';
import { ISavingsPayload } from '../schema/fineract.savings.interface';
import { SavingAccountPayload } from '../kafka';

@injectable()
export class FineractSavingsControllerV1 {   
  constructor(
    @inject(FineractSavingsService) private fineractService: FineractSavingsService
  ) {}

  public async createAndAprroveAndActivateSavingsAccount(payload: SavingAccountPayload): Promise<void> {  
    return this.fineractService.createAndAprroveAndActivateSavingsAccount(payload);
  }
}

