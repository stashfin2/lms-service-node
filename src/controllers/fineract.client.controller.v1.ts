import { injectable, inject } from 'tsyringe';
import { FineractClientService } from '../services/fineract.client.service.v1';
import { IClientPayload } from '../schema/fineract.client.interface';

@injectable()
export class FineractClientControllerV1 {   
  constructor(
    @inject(FineractClientService) private fineractService: FineractClientService
  ) {}

  public async createFineractClient(payload: IClientPayload): Promise<void> {  
    return this.fineractService.createClient(payload);
  }
}

