/**
 * Producer Interface
 * Defines the contract for all Kafka producers
 * Follows Dependency Inversion Principle - depend on abstraction, not concretion
 */

import { KafkaTopics } from '../../config/kafka.config';
import { IEvent } from './IEvent';

export interface IProducer {
  /**
   * Connect to Kafka broker
   */
  connect(): Promise<void>;

  /**
   * Disconnect from Kafka broker
   */
  disconnect(): Promise<void>;

  /**
   * Send a single event to the topic
   * @param event - Event to send
   * @param key - Optional partition key
   */
  send(event: IEvent, key?: string): Promise<void>;

  /**
   * Send multiple events in a batch
   * @param events - Array of events to send
   */
  sendBatch(events: IEvent[]): Promise<void>;

  /**
   * Get the topic this producer is responsible for
   */
  getTopic(): KafkaTopics;

  /**
   * Check if producer is connected
   */
  isConnected(): boolean;
}

