/**
 * System Events
 * Events for auditing, logging, and system operations
 * Follows Domain-Driven Design and Single Responsibility Principle
 */

import { BaseEvent } from '../models/BaseEvent';

// ==================== System Events ====================

export interface AuditLogPayload {
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AuditLogEvent extends BaseEvent {
  constructor(
    payload: AuditLogPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('AuditLog', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as AuditLogPayload).resourceId;
  }
}

export interface ErrorLogPayload {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context: {
    service: string;
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ErrorLogEvent extends BaseEvent {
  constructor(
    payload: ErrorLogPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('ErrorLog', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    const context = (this.payload as ErrorLogPayload).context;
    return context.requestId || context.userId || this.eventId;
  }
}

