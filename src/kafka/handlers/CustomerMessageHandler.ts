/**
 * Customer Message Handler
 * Handles messages from customer-related topics
 * Follows Single Responsibility Principle
 */

import { container, injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';
import { FineractClientControllerV1 } from '../../controllers/fineract.client.controller.v1';

@injectable()
export class CustomerMessageHandler implements IMessageHandler {
  async handle(event: IEvent, rawMessage?: any): Promise<void> {
    logger.info('Processing customer event', {
      eventType: event.eventType,
      eventId: event.eventId,
    });

    try {
      switch (event.eventType) {
        case 'CustomerCreated':
          await this.handleCustomerCreated(event);
          break;
        case 'CustomerUpdated':
          await this.handleCustomerUpdated(event);
          break;
        case 'CustomerKYCCompleted':
          await this.handleCustomerKYCCompleted(event);
          break;
        default:
          logger.warn('Unknown customer event type', { eventType: event.eventType });
      }
    } catch (error) {
      logger.error('Error handling customer event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }
  private async handleCustomerCreated(event: IEvent): Promise<void> {
    logger.info('Handling customer created', {
      eventId: event.eventId,
      payload: event.payload,
    });

    const fineractClientController = container.resolve(FineractClientControllerV1); // Use resolve instead of get

    // Business logic for customer created
    // Example: Send welcome email, create user profile in external systems
    // TODO: Implement actual business logic
    await fineractClientController.createFineractClient(event.payload);
  }

  private async handleCustomerUpdated(event: IEvent): Promise<void> {
    logger.info('Handling customer updated', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for customer updated
    // Example: Sync profile with external systems, update analytics
    // TODO: Implement actual business logic
  }

  private async handleCustomerKYCCompleted(event: IEvent): Promise<void> {
    logger.info('Handling customer KYC completed', {
      eventId: event.eventId,
      payload: event.payload,
    });

    // Business logic for KYC completed
    // Example: Update customer eligibility, trigger loan application flow
    // TODO: Implement actual business logic
  }
}

