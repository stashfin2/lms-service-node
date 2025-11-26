/**
 * Fineract Integration Events
 * Events for Fineract synchronization
 * Follows Domain-Driven Design and Single Responsibility Principle
 */

import { BaseEvent } from '../models/BaseEvent';

// ==================== Fineract Sync Events ====================

export interface FineractClientSyncPayload {
  clientId: string;
  fineractClientId: string;
  syncOperation: 'CREATE' | 'UPDATE' | 'DELETE';
  syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  syncedAt: Date;
  data: any;
  metadata?: Record<string, any>;
}

export class FineractClientSyncEvent extends BaseEvent {
  constructor(
    payload: FineractClientSyncPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('FineractClientSync', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as FineractClientSyncPayload).clientId;
  }
}

export interface FineractLoanSyncPayload {
  loanId: string;
  fineractLoanId: string;
  syncOperation: 'CREATE' | 'UPDATE' | 'APPROVE' | 'DISBURSE' | 'CLOSE';
  syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  syncedAt: Date;
  data: any;
  metadata?: Record<string, any>;
}

export class FineractLoanSyncEvent extends BaseEvent {
  constructor(
    payload: FineractLoanSyncPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('FineractLoanSync', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as FineractLoanSyncPayload).loanId;
  }
}

export interface FineractTransactionSyncPayload {
  transactionId: string;
  fineractTransactionId: string;
  loanId: string;
  syncOperation: 'CREATE' | 'UPDATE';
  syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  syncedAt: Date;
  data: any;
  metadata?: Record<string, any>;
}

export class FineractTransactionSyncEvent extends BaseEvent {
  constructor(
    payload: FineractTransactionSyncPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('FineractTransactionSync', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as FineractTransactionSyncPayload).loanId;
  }
}

