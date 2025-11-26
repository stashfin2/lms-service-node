/**
 * Base Event Interface
 * Defines the contract for all events in the system
 * Follows Interface Segregation Principle - minimal interface
 */

export interface IEvent {
  /**
   * Unique identifier for the event
   */
  eventId: string;

  /**
   * Type of event (e.g., 'LoanApplicationCreated')
   */
  eventType: string;

  /**
   * Timestamp when the event occurred
   */
  timestamp: Date;

  /**
   * Version of the event schema for backward compatibility
   */
  version: string;

  /**
   * Source service or component that generated the event
   */
  source: string;

  /**
   * Correlation ID for tracing related events across services
   */
  correlationId?: string;

  /**
   * User or system that triggered the event
   */
  triggeredBy?: string;

  /**
   * Event payload - specific data for the event
   */
  payload: any;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Event with typed payload
 */
export interface ITypedEvent<T> extends Omit<IEvent, 'payload'> {
  payload: T;
}

