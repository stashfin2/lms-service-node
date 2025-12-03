/**
 * Base Consumer Implementation
 * Abstract base class for all Kafka consumers
 * Follows Template Method Pattern and Single Responsibility Principle
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { container } from 'tsyringe';
import { IConsumer, IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { KafkaTopics } from '../../config/kafka.config';
import { ConsumerTrackingService } from '../services/ConsumerTrackingService';
import { logger } from '../../utils/logger';

export abstract class BaseConsumer implements IConsumer {
  protected consumer: Consumer;
  protected connected: boolean = false;
  protected topics: KafkaTopics[];
  protected groupId: string;
  protected messageHandler: IMessageHandler;
  protected trackingService: ConsumerTrackingService;
  protected consumerGroupId?: number;

  constructor(
    protected kafka: Kafka,
    groupId: string,
    topics: KafkaTopics[],
    messageHandler: IMessageHandler
  ) {
    this.groupId = groupId;
    this.topics = topics;
    this.messageHandler = messageHandler;
    this.trackingService = container.resolve(ConsumerTrackingService);
    this.consumer = kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxInFlightRequests:1,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      logger.warn('Consumer already connected', { groupId: this.groupId });
      return;
    }

    try {
      await this.consumer.connect();
      this.connected = true;
      logger.info('Consumer connected', { groupId: this.groupId, topics: this.topics });

      // Register consumer group in tracking database
      await this.registerConsumerGroup();
    } catch (error) {
      logger.error('Failed to connect consumer', { groupId: this.groupId, error });
      throw error;
    }
  }

  private async registerConsumerGroup(): Promise<void> {
    try {
      const consumerGroup = await this.trackingService.registerConsumerGroup({
        groupId: this.groupId,
        groupName: this.groupId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Consumer group for ${this.topics.join(', ')}`,
        topics: this.topics,
        handlerClass: this.messageHandler.constructor.name,
      });
      this.consumerGroupId = consumerGroup.id;
      await this.trackingService.updateConsumerGroupStatus(this.groupId, 'ACTIVE');
    } catch (error) {
      // Don't fail consumer start if tracking registration fails
      logger.error('Failed to register consumer group for tracking', { groupId: this.groupId, error });
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) {
      logger.warn('Consumer not connected', { groupId: this.groupId });
      return;
    }

    try {
      await this.consumer.disconnect();
      this.connected = false;
      logger.info('Consumer disconnected', { groupId: this.groupId });
    } catch (error) {
      logger.error('Failed to disconnect consumer', { groupId: this.groupId, error });
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this.connected) {
      throw new Error(`Consumer not connected for group: ${this.groupId}`);
    }

    try {
      // Subscribe to topics
      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      logger.info('Consumer subscribed and running', {
        groupId: this.groupId,
        topics: this.topics,
      });
    } catch (error) {
      logger.error('Failed to subscribe consumer', { groupId: this.groupId, error });
      throw error;
    }
  }

  protected async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    let processingId: number | undefined;
    const startTime = Date.now();
    
    try {
      // Parse event
      const eventData = message.value?.toString();
      if (!eventData) {
        logger.warn('Received empty message', { topic, partition, offset: message.offset });
        return;
      }

      const event: IEvent = JSON.parse(eventData);

      logger.info('Processing message', {
        topic,
        partition,
        offset: message.offset,
        eventType: event.eventType,
        eventId: event.eventId,
      });

      // Track message processing start
      if (this.consumerGroupId) {
        try {
          const processing = await this.trackingService.startMessageProcessing(
            this.consumerGroupId,
            topic,
            partition,
            Number(message.offset),
            event
          );
          processingId = processing.id;
        } catch (error) {
          logger.error('Failed to track message processing start', { error });
        }
      }

      // Delegate to handler
      await this.messageHandler.handle(event, message);

      const duration = Date.now() - startTime;

      logger.info('Message processed successfully', {
        topic,
        partition,
        offset: message.offset,
        eventType: event.eventType,
        eventId: event.eventId,
        durationMs: duration,
      });

      // Track successful completion
      if (processingId) {
        try {
          await this.trackingService.completeMessageProcessing(processingId);
        } catch (error) {
          logger.error('Failed to track message processing completion', { error });
        }
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('Error processing message', {
        topic,
        partition,
        offset: message.offset,
        error: error.message,
        durationMs: duration,
      });
      
      // Track failure
      if (processingId) {
        try {
          await this.trackingService.failMessageProcessing(processingId, error, 0);
        } catch (trackingError) {
          logger.error('Failed to track message processing failure', { trackingError });
        }
      }

      // Track error
      if (this.consumerGroupId) {
        try {
          await this.trackingService.trackConsumerError(this.consumerGroupId, error, {
            messageProcessingId: processingId,
            topic,
            partition,
            offset: Number(message.offset),
            eventType: message.value ? JSON.parse(message.value.toString()).eventType : undefined,
            retryCount: 0,
          });
        } catch (trackingError) {
          logger.error('Failed to track consumer error', { trackingError });
        }
      }
      
      // Implement error handling strategy
      await this.handleError(error, payload);
      
      // Re-throw to trigger retry mechanism
      throw error;
    }
  }

  /**
   * Error handling strategy - override in subclasses
   */
  protected async handleError(error: any, payload: EachMessagePayload): Promise<void> {
    // Default: log error
    // Override for custom error handling (DLQ, retry logic, etc.)
    logger.error('Message processing failed', {
      topic: payload.topic,
      partition: payload.partition,
      offset: payload.message.offset,
      error,
    });
  }

  public getTopics(): KafkaTopics[] {
    return this.topics;
  }

  public getGroupId(): string {
    return this.groupId;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async pause(): Promise<void> {
    const topicPartitions = this.topics.map(topic => ({ topic }));
    this.consumer.pause(topicPartitions);
    logger.info('Consumer paused', { groupId: this.groupId, topics: this.topics });
  }

  public async resume(): Promise<void> {
    const topicPartitions = this.topics.map(topic => ({ topic }));
    this.consumer.resume(topicPartitions);
    logger.info('Consumer resumed', { groupId: this.groupId, topics: this.topics });
  }
}

