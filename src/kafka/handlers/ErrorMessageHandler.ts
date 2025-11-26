/**
 * Error Message Handler
 * Handles messages from error log topics
 * Follows Single Responsibility Principle
 */

import { injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';

@injectable()
export class ErrorMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing error event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'ErrorLog':
          await this.handleErrorLog(event);
          break;
        default:
          logger.warn('Unknown error event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling error event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      // Don't throw here to avoid infinite loop
    }
  }

  private async handleErrorLog(event: IEvent): Promise<void> {
    logger.info('Handling error log', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for error log
    // Example: Send to error tracking service (Sentry, DataDog), trigger alerts
    // TODO: Implement actual business logic
  }
}

