import { inject, injectable } from 'tsyringe';
import { ClientRepository } from '../repositories/fineract.client.repo.v1';
import { Client } from '../models/database-models';
import { SavingsRepository } from '../repositories/fineract.savings.repo.v1';
import { SavingsAccount } from '../models/database-models/savingsAccount';

@injectable()
export class SavingsDatabaseServiceV1 {
    constructor(
        @inject(SavingsRepository) private savingsRepo: SavingsRepository
    ) {}

    public async getSavingsAccountByExternalId(externalId: string): Promise<SavingsAccount | null> {
        return await this.savingsRepo.getSavingsAccountByExternalId(externalId);
    }

    public async checkSavingsAccountExists(externalId: string): Promise<boolean> {
        const existence = await this.savingsRepo.checkSavingsAccountExists(externalId);
        return existence ;
    }

    public async createOrUpdateSavingsAccount(savingsAccount: SavingsAccount): Promise<number> {
        return await this.savingsRepo.createSavingsAccount(savingsAccount);
    }

    public async deleteSavingsAccount(savingsAccountId: string): Promise<void> {
        await this.savingsRepo.deleteSavingsAccount(savingsAccountId);
    }

    public async listSavingsAccounts(): Promise<SavingsAccount[]> {
        return await this.savingsRepo.listSavingsAccounts();
    }
}
