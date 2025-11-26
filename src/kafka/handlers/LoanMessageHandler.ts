/**
 * Loan Message Handler
 * Handles messages from loan-related topics
 * Follows Single Responsibility Principle
 */

import { injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';

@injectable()
export class LoanMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing loan event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'LoanApplicationCreated':
          await this.handleLoanApplicationCreated(event);
          break;
        case 'LoanApplicationUpdated':
          await this.handleLoanApplicationUpdated(event);
          break;
        case 'LoanApplicationApproved':
          await this.handleLoanApplicationApproved(event);
          break;
        case 'LoanApplicationRejected':
          await this.handleLoanApplicationRejected(event);
          break;
        default:
          logger.warn('Unknown loan event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling loan event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  private async handleLoanApplicationCreated(event: IEvent): Promise<void> {
    logger.info('Handling loan application created', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for loan application created
    // Example: Update analytics, trigger notifications, sync with external systems
    // TODO: Implement actual business logic
  }

  private async handleLoanApplicationUpdated(event: IEvent): Promise<void> {
    logger.info('Handling loan application updated', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for loan application updated
    // TODO: Implement actual business logic
  }

  private async handleLoanApplicationApproved(event: IEvent): Promise<void> {
    logger.info('Handling loan application approved', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for loan application approved
    // Example: Trigger disbursement workflow, send approval notifications
    // TODO: Implement actual business logic
  }

  private async handleLoanApplicationRejected(event: IEvent): Promise<void> {
    logger.info('Handling loan application rejected', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for loan application rejected
    // Example: Send rejection notifications, update customer records
    // TODO: Implement actual business logic
  }
}

