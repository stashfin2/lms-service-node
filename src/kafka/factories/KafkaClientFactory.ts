/**
 * Kafka Client Factory
 * Singleton factory for creating Kafka client instances
 * Follows Factory Pattern and Singleton Pattern
 */

import { Kafka, logLevel } from 'kafkajs';
import { singleton } from 'tsyringe';
import { config } from '../../config';
import { logger } from '../../utils/logger';

@singleton()
export class KafkaClientFactory {
  private static instance: Kafka | null = null;

  /**
   * Get or create Kafka client instance
   */
  public getKafkaClient(): Kafka {
    if (!KafkaClientFactory.instance) {
      KafkaClientFactory.instance = this.createKafkaClient();
    }
    return KafkaClientFactory.instance;
  }

  /**
   * Create new Kafka client with configuration
   */
  private createKafkaClient(): Kafka {
    logger.info('Creating Kafka client', {
      brokers: config.kafka.brokers,
      clientId: config.kafka.clientId,
    });

    const kafkaConfig: any = {
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      connectionTimeout: config.kafka.connectionTimeout,
      requestTimeout: config.kafka.requestTimeout,
      retry: config.kafka.retry,
      logLevel: this.getLogLevel(),
      logCreator: this.createCustomLogger(),
    };

    // Add SSL configuration if enabled
    if (config.kafka.ssl) {
      kafkaConfig.ssl = true;
    }

    // Add SASL configuration if provided
    if (config.kafka.sasl) {
      kafkaConfig.sasl = config.kafka.sasl;
    }

    return new Kafka(kafkaConfig);
  }

  /**
   * Map application log level to KafkaJS log level
   */
  private getLogLevel(): logLevel {
    const level = config.logging.level.toLowerCase();
    switch (level) {
      case 'error':
        return logLevel.ERROR;
      case 'warn':
        return logLevel.WARN;
      case 'info':
        return logLevel.INFO;
      case 'debug':
        return logLevel.DEBUG;
      default:
        return logLevel.INFO;
    }
  }

  /**
   * Create custom logger for KafkaJS
   */
  private createCustomLogger() {
    return (logLevel: any) => {
      return ({ namespace, level, label, log }: any) => {
        const { message, ...extra } = log;
        
        switch (level) {
          case logLevel.ERROR:
            logger.error(`[${namespace}] ${message}`, extra);
            break;
          case logLevel.WARN:
            logger.warn(`[${namespace}] ${message}`, extra);
            break;
          case logLevel.INFO:
            logger.info(`[${namespace}] ${message}`, extra);
            break;
          case logLevel.DEBUG:
            logger.debug(`[${namespace}] ${message}`, extra);
            break;
          default:
            logger.info(`[${namespace}] ${message}`, extra);
        }
      };
    };
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static reset(): void {
    KafkaClientFactory.instance = null;
  }
}

