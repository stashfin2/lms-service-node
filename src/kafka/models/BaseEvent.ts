/**
 * Base Event Implementation
 * Abstract base class for all events
 * Follows Template Method Pattern and Open/Closed Principle
 */

import { v4 as uuidv4 } from 'uuid';
import { IEvent } from '../interfaces/IEvent';

export abstract class BaseEvent implements IEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly timestamp: Date;
  public readonly version: string;
  public readonly source: string;
  public readonly correlationId?: string;
  public readonly triggeredBy?: string;
  public readonly payload: any;
  public readonly metadata?: Record<string, any>;

  constructor(
    eventType: string,
    payload: any,
    options?: {
      eventId?: string;
      version?: string;
      source?: string;
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    this.eventId = options?.eventId || uuidv4();
    this.eventType = eventType;
    this.timestamp = new Date();
    this.version = options?.version || '1.0.0';
    this.source = options?.source || 'lms-service-node';
    this.correlationId = options?.correlationId;
    this.triggeredBy = options?.triggeredBy;
    this.payload = payload;
    this.metadata = options?.metadata;
  }

  /**
   * Serialize event to JSON string for Kafka
   */
  public serialize(): string {
    return JSON.stringify({
      eventId: this.eventId,
      eventType: this.eventType,
      timestamp: this.timestamp.toISOString(),
      version: this.version,
      source: this.source,
      correlationId: this.correlationId,
      triggeredBy: this.triggeredBy,
      payload: this.payload,
      metadata: this.metadata,
    });
  }

  /**
   * Deserialize JSON string to event object
   */
  public static deserialize<T extends BaseEvent>(json: string): IEvent {
    const data = JSON.parse(json);
    return {
      eventId: data.eventId,
      eventType: data.eventType,
      timestamp: new Date(data.timestamp),
      version: data.version,
      source: data.source,
      correlationId: data.correlationId,
      triggeredBy: data.triggeredBy,
      payload: data.payload,
      metadata: data.metadata,
    };
  }

  /**
   * Validate event data
   * Override in subclasses for specific validation
   */
  public validate(): boolean {
    return !!(
      this.eventId &&
      this.eventType &&
      this.timestamp &&
      this.version &&
      this.source &&
      this.payload
    );
  }

  /**
   * Get event key for Kafka partitioning
   * Override in subclasses for custom partitioning strategy
   */
  public getPartitionKey(): string | undefined {
    return this.correlationId || this.eventId;
  }
}

