/**
 * Event Publisher Interface
 * Facade interface for publishing events to different topics
 * Follows Facade Pattern and Dependency Inversion Principle
 */

import { KafkaTopics } from '../../config/kafka.config';
import { IEvent } from './IEvent';

export interface IEventPublisher {
  /**
   * Publish an event to a specific topic
   * @param topic - Target topic
   * @param event - Event to publish
   * @param key - Optional partition key
   */
  publish(topic: KafkaTopics, event: IEvent, key?: string): Promise<void>;

  /**
   * Publish multiple events to different topics
   * @param events - Array of topic-event pairs
   */
  publishBatch(events: Array<{ topic: KafkaTopics; event: IEvent; key?: string }>): Promise<void>;

  /**
   * Initialize all producers
   */
  initialize(): Promise<void>;

  /**
   * Shutdown all producers
   */
  shutdown(): Promise<void>;
}

