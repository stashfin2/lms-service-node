import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'lms_service',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'lms-service',
    groupId: process.env.KAFKA_GROUP_ID || 'lms-service-consumer-group',
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '10000', 10),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000', 10),
    retry: {
      retries: parseInt(process.env.KAFKA_RETRIES || '5', 10),
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '300', 10),
      maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME || '30000', 10),
    },
    ssl: process.env.KAFKA_SSL_ENABLED === 'true',
    sasl: process.env.KAFKA_SASL_MECHANISM ? {
      mechanism: process.env.KAFKA_SASL_MECHANISM as any,
      username: process.env.KAFKA_SASL_USERNAME || '',
      password: process.env.KAFKA_SASL_PASSWORD || '',
    } : undefined,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

