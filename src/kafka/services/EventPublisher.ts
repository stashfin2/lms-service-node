/**
 * Event Publisher Service
 * Facade for publishing events to Kafka topics
 * Follows Facade Pattern, Single Responsibility, and Dependency Inversion Principles
 */

import { singleton, inject } from 'tsyringe';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { IEvent } from '../interfaces/IEvent';
import { KafkaTopics } from '../../config/kafka.config';
import { ProducerFactory } from '../factories/ProducerFactory';
import { logger } from '../../utils/logger';

@singleton()
export class EventPublisher implements IEventPublisher {
  private initialized: boolean = false;

  constructor(
    @inject(ProducerFactory) private producerFactory: ProducerFactory
  ) {}

  /**
   * Initialize all required producers
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('EventPublisher already initialized');
      return;
    }

    try {
      logger.info('Initializing EventPublisher');

      // Pre-create producers for all topics
      const topics = Object.values(KafkaTopics);
      this.producerFactory.createProducers(topics);

      // Connect all producers
      await this.producerFactory.connectAll();

      this.initialized = true;
      logger.info('EventPublisher initialized successfully', {
        producerCount: this.producerFactory.getConnectedCount(),
      });
    } catch (error) {
      logger.error('Failed to initialize EventPublisher', { error });
      throw error;
    }
  }

  /**
   * Publish an event to a specific topic
   */
  public async publish(topic: KafkaTopics, event: IEvent, key?: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('EventPublisher not initialized. Call initialize() first.');
    }

    try {
      const producer = this.producerFactory.getProducer(topic);
      
      if (!producer.isConnected()) {
        logger.warn('Producer not connected, attempting to connect', { topic });
        await producer.connect();
      }

      await producer.send(event, key);

      logger.info('Event published successfully', {
        topic,
        eventType: event.eventType,
        eventId: event.eventId,
      });
    } catch (error) {
      logger.error('Failed to publish event', {
        topic,
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  /**
   * Publish multiple events to different topics in a batch
   */
  public async publishBatch(
    events: Array<{ topic: KafkaTopics; event: IEvent; key?: string }>
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('EventPublisher not initialized. Call initialize() first.');
    }

    if (events.length === 0) {
      logger.warn('Attempted to publish empty batch');
      return;
    }

    try {
      logger.info('Publishing batch of events', { count: events.length });

      // Group events by topic for efficient batch sending
      const eventsByTopic = new Map<KafkaTopics, Array<{ event: IEvent; key?: string }>>();
      
      for (const { topic, event, key } of events) {
        if (!eventsByTopic.has(topic)) {
          eventsByTopic.set(topic, []);
        }
        eventsByTopic.get(topic)!.push({ event, key });
      }

      // Send batches to each topic
      const publishPromises = Array.from(eventsByTopic.entries()).map(
        async ([topic, topicEvents]) => {
          const producer = this.producerFactory.getProducer(topic);
          
          if (!producer.isConnected()) {
            logger.warn('Producer not connected, attempting to connect', { topic });
            await producer.connect();
          }

          // Send each event (KafkaJS handles batching internally)
          await Promise.all(
            topicEvents.map(({ event, key }) => producer.send(event, key))
          );
        }
      );

      await Promise.all(publishPromises);

      logger.info('Batch published successfully', { count: events.length });
    } catch (error) {
      logger.error('Failed to publish batch', { count: events.length, error });
      throw error;
    }
  }

  /**
   * Shutdown the event publisher and disconnect all producers
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      logger.warn('EventPublisher not initialized');
      return;
    }

    try {
      logger.info('Shutting down EventPublisher');
      await this.producerFactory.disconnectAll();
      this.initialized = false;
      logger.info('EventPublisher shut down successfully');
    } catch (error) {
      logger.error('Error during EventPublisher shutdown', { error });
      throw error;
    }
  }

  /**
   * Check if publisher is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get health status of all producers
   */
  public getHealthStatus(): {
    initialized: boolean;
    totalProducers: number;
    connectedProducers: number;
  } {
    return {
      initialized: this.initialized,
      totalProducers: this.producerFactory.getAllProducers().length,
      connectedProducers: this.producerFactory.getConnectedCount(),
    };
  }
}

