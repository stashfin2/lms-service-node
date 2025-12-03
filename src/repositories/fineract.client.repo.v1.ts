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
      const [rows] = await this.pool.query<RowDataPacket[]>(
        'SELECT * FROM fineract_client WHERE resource_external_id = ?',
        [resourceExternalId]
      );
      if (!rows[0]) {
        return null;
      }
      return this.mapClient(rows[0]);
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
      const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM fineract_client');
      return rows.map(row => this.mapClient(row));
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
          id, office_id, client_id, savings_id, resource_id, 
          resource_external_id, status, create_date, update_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          office_id = COALESCE(VALUES(office_id), office_id),
          client_id = COALESCE(VALUES(client_id), client_id),
          savings_id = COALESCE(VALUES(savings_id), savings_id),
          resource_id = COALESCE(VALUES(resource_id), resource_id),
          resource_external_id = VALUES(resource_external_id),
          status = VALUES(status),
          update_date = VALUES(update_date)
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
        'SELECT COUNT(*) as count FROM fineract_client WHERE resource_external_id = ? and status = "active"',
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

  /**
   * Map database row (snake_case) to Client model (camelCase)
   */
  private mapClient(row: RowDataPacket): Client {
    return {
      id: row.id,
      officeId: row.office_id,
      clientId: row.client_id,
      savingsId: row.savings_id,
      resourceId: row.resource_id,
      resourceExternalId: row.resource_external_id,
      status: row.status,
      createDate: row.create_date,
      updateDate: row.update_date,
    };
  }

}

