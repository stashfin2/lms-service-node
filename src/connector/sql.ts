import { singleton } from 'tsyringe';
import mysql from 'mysql2/promise';
import { Pool, PoolConnection, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

import { config } from '../config/environment';
import { logger } from '../utils/logger';

@singleton()
export class DirectoryDatabaseConnector {
  public pool: Pool;

  constructor() {
    const poolConfig: PoolOptions = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

    this.pool = mysql.createPool(poolConfig);

    logger.info('Directory database connector initialized (MySQL)', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
    });
  }

  public async getConnection(): Promise<PoolConnection> {
    return this.pool.getConnection();
  }

  public async query<T extends RowDataPacket[] | RowDataPacket[][] | ResultSetHeader>(
    text: string,
    params?: unknown[]
  ): Promise<[T, any]> {
    return this.pool.query<T>(text, params);
  }

  public async shutdown(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  public getPool(): Pool {
    return this.pool;
  }
}


