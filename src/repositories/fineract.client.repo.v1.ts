import { injectable, inject } from 'tsyringe';
import { DirectoryDatabaseConnector } from '../connector/sql';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Client, ClientModel } from '../models/database-models';
import { logger } from '../utils/logger'; 


@injectable()
export class ClientRepository {
  private pool: Pool;

  constructor(
    @inject(DirectoryDatabaseConnector) private dbConnector: DirectoryDatabaseConnector
  ) {
    this.pool = dbConnector.getPool();
  }

  public async getClientByExternalId(resourceExternalId: string): Promise<Client | null> {
    try {
      const [rows] = await this.pool.query<ClientModel[]>(
        'SELECT * FROM fineract_client WHERE resourceExternalId = ?',
        [resourceExternalId]
      );
      return rows[0] as Client | null;
    } catch (error: any) {
      logger.error('Error getting client by external ID', {
        resourceExternalId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get client by external ID: ${resourceExternalId}. ${error.message}`);
    }
  }

  public async deleteClient(clientId: string): Promise<void> {
    try {
      await this.pool.query('DELETE FROM fineract_client WHERE id = ?', [clientId]);
    } catch (error: any) {
      logger.error('Error deleting client', {
        clientId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to delete client: ${clientId}. ${error.message}`);
    }
  }

  public async listClients(): Promise<Client[]> {
    try {
      const [rows] = await this.pool.query<ClientModel[]>('SELECT * FROM fineract_client');
      return rows as Client[];
    } catch (error: any) {
      logger.error('Error listing clients', {
        operation: 'listClients',
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to list clients. ${error.message}`);
    }
  }

  public async createClient(client: Client): Promise<number> {
    try {
      // Validate required fields
      if (!client.resourceExternalId) {
        throw new Error('resourceExternalId is required');
      }
      if (!client.status) {
        throw new Error('status is required');
      }

      const now = new Date();
      const [result] = await this.pool.query<ResultSetHeader>(
        `INSERT INTO fineract_client (
          id, officeId, clientId, savingsId, resourceId, 
          resourceExternalId, status, createDate, updateDate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          officeId = COALESCE(VALUES(officeId), officeId),
          clientId = COALESCE(VALUES(clientId), clientId),
          savingsId = COALESCE(VALUES(savingsId), savingsId),
          resourceId = COALESCE(VALUES(resourceId), resourceId),
          resourceExternalId = VALUES(resourceExternalId),
          status = VALUES(status),
          updateDate = VALUES(updateDate)
        `,
        [
          client.id ?? null,
          client.officeId ?? null,
          client.clientId ?? null,
          client.savingsId ?? null,
          client.resourceId ?? null,
          client.resourceExternalId,
          client.status,
          client.createDate ?? now,
          now, 
        ]
      );
      return result.insertId || client.id || 0;
    } catch (error: any) {
      logger.error('Error creating/updating client', {
        resourceExternalId: client.resourceExternalId,
        clientId: client.id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to create/update client: ${client.resourceExternalId}. ${error.message}`);
    }
  }

  public async checkClientExists(resourceExternalId: string): Promise<boolean> {
    try {
      const [rows] = await this.pool.query<(RowDataPacket & { count: number })[]>(
        'SELECT COUNT(*) as count FROM fineract_client WHERE resourceExternalId = ? and status = "active"',
        [resourceExternalId]
      );
      return rows[0].count > 0;
    } catch (error: any) {
      logger.error('Error checking client existence', {
        resourceExternalId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to check client existence: ${resourceExternalId}. ${error.message}`);
    }
  }


}

