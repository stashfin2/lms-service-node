/**
 * Base Producer Implementation
 * Abstract base class for all Kafka producers
 * Follows Template Method Pattern and Single Responsibility Principle
 */

import { Kafka, Producer, ProducerRecord, Message } from 'kafkajs';
import { IProducer } from '../interfaces/IProducer';
import { IEvent } from '../interfaces/IEvent';
import { KafkaTopics } from '../../config/kafka.config';
import { logger } from '../../utils/logger';

export abstract class BaseProducer implements IProducer {
  protected producer: Producer;
  protected connected: boolean = false;
  protected topic: KafkaTopics;

  constructor(
    protected kafka: Kafka,
    topic: KafkaTopics
  ) {
    this.topic = topic;
    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
      idempotent: true, // Ensure exactly-once semantics
      maxInFlightRequests: 5,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      logger.warn('Producer already connected', { topic: this.topic });
      return;
    }

    try {
      await this.producer.connect();
      this.connected = true;
      logger.info('Producer connected', { topic: this.topic });
    } catch (error) {
      logger.error('Failed to connect producer', { topic: this.topic, error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) {
      logger.warn('Producer not connected', { topic: this.topic });
      return;
    }

    try {
      await this.producer.disconnect();
      this.connected = false;
      logger.info('Producer disconnected', { topic: this.topic });
    } catch (error) {
      logger.error('Failed to disconnect producer', { topic: this.topic, error });
      throw error;
    }
  }

  public async send(event: IEvent, key?: string): Promise<void> {
    if (!this.connected) {
      throw new Error(`Producer not connected for topic: ${this.topic}`);
    }

    try {
      const message: Message = {
        key: key || event.eventId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          timestamp: event.timestamp.toISOString(),
          source: event.source,
          version: event.version,
          ...(event.correlationId && { correlationId: event.correlationId }),
        },
      };

      const record: ProducerRecord = {
        topic: this.topic,
        messages: [message],
      };

      await this.producer.send(record);
      logger.info('Event sent successfully', {
        topic: this.topic,
        eventType: event.eventType,
        eventId: event.eventId,
      });
    } catch (error) {
      logger.error('Failed to send event', {
        topic: this.topic,
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  public async sendBatch(events: IEvent[]): Promise<void> {
    if (!this.connected) {
      throw new Error(`Producer not connected for topic: ${this.topic}`);
    }

    if (events.length === 0) {
      logger.warn('Attempted to send empty batch', { topic: this.topic });
      return;
    }

    try {
      const messages: Message[] = events.map((event) => ({
        key: event.eventId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          timestamp: event.timestamp.toISOString(),
          source: event.source,
          version: event.version,
          ...(event.correlationId && { correlationId: event.correlationId }),
        },
      }));

      const record: ProducerRecord = {
        topic: this.topic,
        messages,
      };

      await this.producer.send(record);
      logger.info('Batch sent successfully', {
        topic: this.topic,
        eventCount: events.length,
      });
    } catch (error) {
      logger.error('Failed to send batch', {
        topic: this.topic,
        eventCount: events.length,
        error,
      });
      throw error;
    }
  }

  public getTopic(): KafkaTopics {
    return this.topic;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

