import { injectable, inject } from 'tsyringe';
import { FineractRepoV1 } from '../repositories/fineract.repo.v1';

@injectable()
export class FineractServiceV1 {
  constructor(
    @inject(FineractRepoV1) private fineractRepo: FineractRepoV1
  ) {}

  // Placeholder methods for Fineract API integration
  // Abstracts all third-party Fineract API calls
  // All methods accept/return model objects from /models
}

