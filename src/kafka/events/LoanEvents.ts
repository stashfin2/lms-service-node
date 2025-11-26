/**
 * Loan Domain Events
 * Domain-specific events for loan lifecycle
 * Follows Domain-Driven Design and Single Responsibility Principle
 */

import { BaseEvent } from '../models/BaseEvent';

// ==================== Loan Application Events ====================

export interface LoanApplicationPayload {
  applicationId: string;
  customerId: string;
  loanAmount: number;
  loanPurpose: string;
  loanTerm: number;
  interestRate?: number;
  status: string;
  appliedAt: Date;
  metadata?: Record<string, any>;
}

export class LoanApplicationCreatedEvent extends BaseEvent {
  constructor(
    payload: LoanApplicationPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanApplicationCreated', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanApplicationPayload).customerId;
  }
}

export class LoanApplicationUpdatedEvent extends BaseEvent {
  constructor(
    payload: LoanApplicationPayload & { updatedFields: string[] },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanApplicationUpdated', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanApplicationPayload).customerId;
  }
}

export class LoanApplicationApprovedEvent extends BaseEvent {
  constructor(
    payload: LoanApplicationPayload & {
      approvedBy: string;
      approvedAt: Date;
      approvalNotes?: string;
    },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanApplicationApproved', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanApplicationPayload).customerId;
  }
}

export class LoanApplicationRejectedEvent extends BaseEvent {
  constructor(
    payload: LoanApplicationPayload & {
      rejectedBy: string;
      rejectedAt: Date;
      rejectionReason: string;
    },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanApplicationRejected', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanApplicationPayload).customerId;
  }
}

// ==================== Loan Disbursement Events ====================

export interface LoanDisbursementPayload {
  disbursementId: string;
  loanId: string;
  customerId: string;
  amount: number;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  status: string;
  initiatedAt: Date;
  metadata?: Record<string, any>;
}

export class LoanDisbursementInitiatedEvent extends BaseEvent {
  constructor(
    payload: LoanDisbursementPayload,
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanDisbursementInitiated', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanDisbursementPayload).customerId;
  }
}

export class LoanDisbursementCompletedEvent extends BaseEvent {
  constructor(
    payload: LoanDisbursementPayload & {
      completedAt: Date;
      transactionReference: string;
    },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanDisbursementCompleted', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanDisbursementPayload).customerId;
  }
}

export class LoanDisbursementFailedEvent extends BaseEvent {
  constructor(
    payload: LoanDisbursementPayload & {
      failedAt: Date;
      failureReason: string;
      errorCode?: string;
    },
    options?: {
      correlationId?: string;
      triggeredBy?: string;
      metadata?: Record<string, any>;
    }
  ) {
    super('LoanDisbursementFailed', payload, {
      ...options,
      version: '1.0.0',
    });
  }

  public getPartitionKey(): string {
    return (this.payload as LoanDisbursementPayload).customerId;
  }
}

