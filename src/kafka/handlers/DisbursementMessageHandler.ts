/**
 * Disbursement Message Handler
 * Handles messages from disbursement-related topics
 * Follows Single Responsibility Principle
 */

import { injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';

@injectable()
export class DisbursementMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing disbursement event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'LoanDisbursementInitiated':
          await this.handleDisbursementInitiated(event);
          break;
        case 'LoanDisbursementCompleted':
          await this.handleDisbursementCompleted(event);
          break;
        case 'LoanDisbursementFailed':
          await this.handleDisbursementFailed(event);
          break;
        default:
          logger.warn('Unknown disbursement event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling disbursement event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  private async handleDisbursementInitiated(event: IEvent): Promise<void> {
    logger.info('Handling disbursement initiated', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for disbursement initiated
    // Example: Trigger payment gateway, update loan status
    // TODO: Implement actual business logic
  }

  private async handleDisbursementCompleted(event: IEvent): Promise<void> {
    logger.info('Handling disbursement completed', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for disbursement completed
    // Example: Update loan status, send success notifications, sync with Fineract
    // TODO: Implement actual business logic
  }

  private async handleDisbursementFailed(event: IEvent): Promise<void> {
    logger.info('Handling disbursement failed', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for disbursement failed
    // Example: Trigger retry mechanism, send failure notifications, log errors
    // TODO: Implement actual business logic
  }
}

