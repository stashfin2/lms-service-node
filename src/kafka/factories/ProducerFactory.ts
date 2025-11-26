/**
 * Producer Factory
 * Factory for creating topic-specific producers
 * Follows Factory Pattern and Single Responsibility Principle
 */

import { singleton, inject } from 'tsyringe';
import { IProducer } from '../interfaces/IProducer';
import { KafkaTopics } from '../../config/kafka.config';
import { KafkaClientFactory } from './KafkaClientFactory';
import { BaseProducer } from '../core/BaseProducer';
import { logger } from '../../utils/logger';

/**
 * Concrete producer implementation for specific topics
 */
class TopicProducer extends BaseProducer {
  constructor(kafkaClientFactory: KafkaClientFactory, topic: KafkaTopics) {
    super(kafkaClientFactory.getKafkaClient(), topic);
  }
}

@singleton()
export class ProducerFactory {
  private producers: Map<KafkaTopics, IProducer> = new Map();

  constructor(
    @inject(KafkaClientFactory) private kafkaClientFactory: KafkaClientFactory
  ) {}

  /**
   * Get or create a producer for a specific topic
   * @param topic - The Kafka topic
   */
  public getProducer(topic: KafkaTopics): IProducer {
    if (!this.producers.has(topic)) {
      logger.info('Creating new producer', { topic });
      const producer = new TopicProducer(this.kafkaClientFactory, topic);
      this.producers.set(topic, producer);
    }
    return this.producers.get(topic)!;
  }

  /**
   * Create producers for multiple topics
   * @param topics - Array of topics
   */
  public createProducers(topics: KafkaTopics[]): IProducer[] {
    return topics.map(topic => this.getProducer(topic));
  }

  /**
   * Connect all producers
   */
  public async connectAll(): Promise<void> {
    const producers = Array.from(this.producers.values());
    logger.info('Connecting all producers', { count: producers.length });
    
    await Promise.all(
      producers.map(producer => producer.connect())
    );
    
    logger.info('All producers connected', { count: producers.length });
  }

  /**
   * Disconnect all producers
   */
  public async disconnectAll(): Promise<void> {
    const producers = Array.from(this.producers.values());
    logger.info('Disconnecting all producers', { count: producers.length });
    
    await Promise.all(
      producers.map(producer => producer.disconnect())
    );
    
    this.producers.clear();
    logger.info('All producers disconnected');
  }

  /**
   * Get all active producers
   */
  public getAllProducers(): IProducer[] {
    return Array.from(this.producers.values());
  }

  /**
   * Get connected producer count
   */
  public getConnectedCount(): number {
    return Array.from(this.producers.values()).filter(p => p.isConnected()).length;
  }
}

