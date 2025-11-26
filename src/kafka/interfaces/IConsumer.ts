/**
 * Consumer Interface
 * Defines the contract for all Kafka consumers
 * Follows Dependency Inversion Principle
 */

import { KafkaTopics } from '../../config/kafka.config';
import { IEvent } from './IEvent';

export interface IMessageHandler {
  /**
   * Handle a single message
   * @param event - Parsed event from Kafka
   * @param rawMessage - Raw Kafka message for advanced processing
   */
  handle(event: IEvent, rawMessage?: any): Promise<void>;
}

export interface IConsumer {
  /**
   * Connect and start consuming messages
   */
  connect(): Promise<void>;

  /**
   * Stop consuming and disconnect
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to topics and start processing
   */
  subscribe(): Promise<void>;

  /**
   * Get the topics this consumer is subscribed to
   */
  getTopics(): KafkaTopics[];

  /**
   * Get the consumer group ID
   */
  getGroupId(): string;

  /**
   * Check if consumer is connected
   */
  isConnected(): boolean;

  /**
   * Pause consumption
   */
  pause(): Promise<void>;

  /**
   * Resume consumption
   */
  resume(): Promise<void>;
}

