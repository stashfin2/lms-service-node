import { inject, injectable } from 'tsyringe';
import { ClientRepository } from '../repositories/fineract.client.repo.v1';
import { Client } from '../models/database-models';

@injectable()
export class ClientDatabaseServiceV1 {
    constructor(
        @inject(ClientRepository) private clientRepo: ClientRepository
    ) {}

    public async getClientByExternalId(resourceExternalId: string): Promise<Client | null> {
        return await this.clientRepo.getClientByExternalId(resourceExternalId);
    }

    public async checkClientExists(resourceExternalId: string): Promise<boolean> {
        const existence = await this.clientRepo.checkClientExists(resourceExternalId);
        return existence ;
    }

    public async createOrUpdateClient(client: Client): Promise<number> {
        return await this.clientRepo.createClient(client);
    }

    public async deleteClient(clientId: string): Promise<void> {
        await this.clientRepo.deleteClient(clientId);
    }

    public async listClients(): Promise<Client[]> {
        return await this.clientRepo.listClients();
    }
}
