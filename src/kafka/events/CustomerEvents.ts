/**
 * Customer Domain Events
 * Domain-specific events for customer lifecycle
 * Follows Domain-Driven Design and Single Responsibility Principle
 */

import { BaseEvent } from '../models/BaseEvent';

// ==================== Customer Events ====================

export interface CustomerPayload {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  status: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class CustomerCreatedEvent extends BaseEvent {
  constructor(
    payload: CustomerPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('CustomerCreated', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as CustomerPayload).customerId;
  }
}

export class CustomerUpdatedEvent extends BaseEvent {
  constructor(
    payload: CustomerPayload & {
      updatedFields: string[];
      updatedAt: Date;
    },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('CustomerUpdated', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as CustomerPayload).customerId;
  }
}

export interface KYCPayload {
  customerId: string;
  kycType: string;
  documentType: string;
  documentNumber: string;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt: Date;
  metadata?: Record<string, any>;
}

export class CustomerKYCCompletedEvent extends BaseEvent {
  constructor(
    payload: KYCPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('CustomerKYCCompleted', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as KYCPayload).customerId;
  }
}

