/**
 * Consumer Factory
 * Factory for creating consumers with message handlers
 * Follows Factory Pattern and Dependency Inversion Principle
 */

import { singleton, inject } from 'tsyringe';
import { IConsumer, IMessageHandler } from '../interfaces/IConsumer';
import { KafkaTopics } from '../../config/kafka.config';
import { KafkaClientFactory } from './KafkaClientFactory';
import { BaseConsumer } from '../core/BaseConsumer';
import { logger } from '../../utils/logger';

/**
 * Concrete consumer implementation
 */
class TopicConsumer extends BaseConsumer {
  constructor(
    kafkaClientFactory: KafkaClientFactory,
    groupId: string,
    topics: KafkaTopics[],
    handler: IMessageHandler
  ) {
    super(kafkaClientFactory.getKafkaClient(), groupId, topics, handler);
  }
}

@singleton()
export class ConsumerFactory {
  private consumers: Map<string, IConsumer> = new Map();

  constructor(
    @inject(KafkaClientFactory) private kafkaClientFactory: KafkaClientFactory
  ) {}

  /**
   * Create a consumer for specific topics with a message handler
   * @param groupId - Consumer group ID
   * @param topics - Topics to subscribe to
   * @param handler - Message handler
   */
  public createConsumer(
    groupId: string,
    topics: KafkaTopics[],
    handler: IMessageHandler
  ): IConsumer {
    const key = `${groupId}-${topics.join(',')}`;
    
    if (this.consumers.has(key)) {
      logger.warn('Consumer already exists', { groupId, topics });
      return this.consumers.get(key)!;
    }

    logger.info('Creating new consumer', { groupId, topics });
    const consumer = new TopicConsumer(
      this.kafkaClientFactory,
      groupId,
      topics,
      handler
    );
    
    this.consumers.set(key, consumer);
    return consumer;
  }

  /**
   * Get an existing consumer
   */
  public getConsumer(groupId: string): IConsumer | undefined {
    return Array.from(this.consumers.values()).find(
      consumer => consumer.getGroupId() === groupId
    );
  }

  /**
   * Connect all consumers
   */
  public async connectAll(): Promise<void> {
    const consumers = Array.from(this.consumers.values());
    logger.info('Connecting all consumers', { count: consumers.length });
    
    await Promise.all(
      consumers.map(consumer => consumer.connect())
    );
    
    logger.info('All consumers connected', { count: consumers.length });
  }

  /**
   * Subscribe all consumers
   */
  public async subscribeAll(): Promise<void> {
    const consumers = Array.from(this.consumers.values());
    logger.info('Subscribing all consumers', { count: consumers.length });
    
    await Promise.all(
      consumers.map(consumer => consumer.subscribe())
    );
    
    logger.info('All consumers subscribed', { count: consumers.length });
  }

  /**
   * Disconnect all consumers
   */
  public async disconnectAll(): Promise<void> {
    const consumers = Array.from(this.consumers.values());
    logger.info('Disconnecting all consumers', { count: consumers.length });
    
    await Promise.all(
      consumers.map(consumer => consumer.disconnect())
    );
    
    this.consumers.clear();
    logger.info('All consumers disconnected');
  }

  /**
   * Get all active consumers
   */
  public getAllConsumers(): IConsumer[] {
    return Array.from(this.consumers.values());
  }

  /**
   * Get connected consumer count
   */
  public getConnectedCount(): number {
    return Array.from(this.consumers.values()).filter(c => c.isConnected()).length;
  }
}

