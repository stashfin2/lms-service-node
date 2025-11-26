/**
 * Fineract Sync Message Handler
 * Handles messages from Fineract synchronization topics
 * Follows Single Responsibility Principle
 */

import { injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';

@injectable()
export class FineractSyncMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing Fineract sync event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'FineractClientSync':
          await this.handleClientSync(event);
          break;
        case 'FineractLoanSync':
          await this.handleLoanSync(event);
          break;
        case 'FineractTransactionSync':
          await this.handleTransactionSync(event);
          break;
        default:
          logger.warn('Unknown Fineract sync event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling Fineract sync event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  private async handleClientSync(event: IEvent): Promise<void> {
    logger.info('Handling Fineract client sync', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for client sync
    // Example: Sync customer data with Fineract, handle sync status
    // TODO: Implement actual business logic
  }

  private async handleLoanSync(event: IEvent): Promise<void> {
    logger.info('Handling Fineract loan sync', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for loan sync
    // Example: Sync loan data with Fineract, handle sync status
    // TODO: Implement actual business logic
  }

  private async handleTransactionSync(event: IEvent): Promise<void> {
    logger.info('Handling Fineract transaction sync', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for transaction sync
    // Example: Sync transaction data with Fineract, handle sync status
    // TODO: Implement actual business logic
  }
}

