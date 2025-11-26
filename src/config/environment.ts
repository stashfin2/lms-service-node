import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Validate required environment variable
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get optional environment variable with no default
 */
function getEnv(name: string): string | undefined {
  return process.env[name];
}

export const config = {
  nodeEnv: requireEnv('NODE_ENV'),
  port: parseInt(requireEnv('PORT'), 10),
  
  database: {
    host: requireEnv('DB_HOST'),
    port: parseInt(requireEnv('DB_PORT'), 10),
    name: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
  },

  kafka: {
    brokers: (getEnv('KAFKA_BOOTSTRAP_SERVERS') || requireEnv('KAFKA_BROKERS')).split(','),
    clientId: requireEnv('KAFKA_CLIENT_ID'),
    groupId: requireEnv('KAFKA_GROUP_ID'),
    connectionTimeout: parseInt(requireEnv('KAFKA_CONNECTION_TIMEOUT'), 10),
    requestTimeout: parseInt(requireEnv('KAFKA_REQUEST_TIMEOUT'), 10),
    retry: {
      retries: parseInt(requireEnv('KAFKA_RETRIES'), 10),
      initialRetryTime: parseInt(requireEnv('KAFKA_INITIAL_RETRY_TIME'), 10),
      maxRetryTime: parseInt(requireEnv('KAFKA_MAX_RETRY_TIME'), 10),
    },
    ssl: getEnv('KAFKA_SSL_ENABLED') === 'true',
    sasl: getEnv('KAFKA_SASL_MECHANISM') ? {
      mechanism: getEnv('KAFKA_SASL_MECHANISM') as any,
      username: getEnv('KAFKA_SASL_USERNAME') || '',
      password: getEnv('KAFKA_SASL_PASSWORD') || '',
    } : undefined,
  },

  logging: {
    level: requireEnv('LOG_LEVEL'),
  },
};

