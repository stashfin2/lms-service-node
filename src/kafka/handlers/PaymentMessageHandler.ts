/**
 * Payment Message Handler
 * Handles messages from payment-related topics
 * Follows Single Responsibility Principle
 */

import { injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';

@injectable()
export class PaymentMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing payment event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'PaymentReceived':
          await this.handlePaymentReceived(event);
          break;
        case 'PaymentFailed':
          await this.handlePaymentFailed(event);
          break;
        default:
          logger.warn('Unknown payment event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling payment event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  private async handlePaymentReceived(event: IEvent): Promise<void> {
    logger.info('Handling payment received', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for payment received
    // Example: Update loan balance, generate receipt, send confirmation
    // TODO: Implement actual business logic
  }

  private async handlePaymentFailed(event: IEvent): Promise<void> {
    logger.info('Handling payment failed', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for payment failed
    // Example: Trigger retry, send failure notification, update payment status
    // TODO: Implement actual business logic
  }
}

