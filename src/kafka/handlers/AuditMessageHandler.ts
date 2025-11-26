/**
 * Audit Message Handler
 * Handles messages from audit log topics
 * Follows Single Responsibility Principle
 */

import { injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';

@injectable()
export class AuditMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing audit event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'AuditLog':
          await this.handleAuditLog(event);
          break;
        default:
          logger.warn('Unknown audit event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling audit event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  private async handleAuditLog(event: IEvent): Promise<void> {
    logger.info('Handling audit log', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for audit log
    // Example: Store in audit database, trigger compliance checks, send alerts
    // TODO: Implement actual business logic
  }
}

