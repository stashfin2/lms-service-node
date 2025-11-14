import { injectable, inject } from 'tsyringe';
import { FineractDatabaseServiceV1 } from '../database/fineract.database.service.v1';

@injectable()
export class FineractRepoV1 {
  constructor(
    @inject(FineractDatabaseServiceV1) private fineractDbService: FineractDatabaseServiceV1
  ) {}

  // Placeholder methods for Fineract data access
  // All methods accept/return model objects from /models
}

