import { singleton } from 'tsyringe';
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';

import { config } from '../config/environment';
import { logger } from '../utils/logger';

@singleton()
export class DirectoryDatabaseConnector {
  private pool: Pool;

  constructor() {
    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (error) => {
      logger.error('Unexpected database error on idle client', error);
    });

    logger.info('Directory database connector initialized', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
    });
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async query<T extends Record<string, any> = Record<string, any>>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  public async shutdown(): Promise<void> {
    await this.pool.end();
  }
   
}


