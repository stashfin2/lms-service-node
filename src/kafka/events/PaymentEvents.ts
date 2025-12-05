/**
 * Payment Domain Events
 * Domain-specific events for payment processing
 * Follows Domain-Driven Design and Single Responsibility Principle
 */

import { BaseEvent } from '../models/BaseEvent';

// ==================== Payment Events ====================

export interface PaymentPayload {
  paymentId: string | number;
  loanId: string | number;
  customerId: string | number;
  amount: number;
  paymentStatus: string;
  metadata?: Record<string, any>;
}

export class PaymentReceivedEvent extends BaseEvent {
  constructor(
    payload: PaymentPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('PaymentReceived', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return String((this.payload as PaymentPayload).customerId);
  }
}

export class PaymentFailedEvent extends BaseEvent {
  constructor(
    payload: PaymentPayload & {
      failureReason: string;
      errorCode?: string;
      retryAttempt?: number;
    },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('PaymentFailed', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return String((this.payload as PaymentPayload).customerId);
  }
}

