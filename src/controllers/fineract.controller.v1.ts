import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { FineractServiceV1 } from '../services/fineract.service.v1';

@injectable()
export class FineractControllerV1 {
  constructor(
    @inject(FineractServiceV1) private fineractService: FineractServiceV1
  ) {}

  // Placeholder methods for Fineract operations
  // Optional controller - can be used for direct Fineract API proxying
}

