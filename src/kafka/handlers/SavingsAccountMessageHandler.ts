/**
 * Savings Account Message Handler
 * Handles messages from savings account-related topics
 * Follows Single Responsibility Principle
 */

import { inject, injectable } from 'tsyringe';
import { IMessageHandler } from '../interfaces/IConsumer';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';
import { FineractSavingsControllerV1 } from '../../controllers/fineract.savings.controller.v1';
import { SavingAccountPayload } from '../events';

@injectable()
export class SavingsAccountMessageHandler implements IMessageHandler {
    constructor(
        @inject(FineractSavingsControllerV1) private fineractSavingsController: FineractSavingsControllerV1
    ) { }
    async handle(event: IEvent, rawMessage?: any): Promise<void> {
        logger.info('Processing savings account event', {
            eventType: event.eventType,
            eventId: event.eventId,
        });

        try {
            switch (event.eventType) {
                case 'SavingsAccountCreated':
                    await this.handleSavingsAccountCreated(event);
                    break;
                case 'SavingsAccountUpdated':
                    await this.handleSavingsAccountUpdated(event);
                    break;
                case 'SavingsAccountDeleted':
                    await this.handleSavingsAccountDeleted(event);
                    break;
                default:
                    logger.warn('Unknown savings account event type', { eventType: event.eventType });
            }
        } catch (error) {
            logger.error('Error handling savings account event', {
                eventType: event.eventType,
                eventId: event.eventId,
                error,
            });
            throw error;
        }
    }

    private async handleSavingsAccountCreated(event: IEvent): Promise<void> {
        logger.info('Handling savings account created', {
            eventId: event.eventId,
            payload: event.payload,
        });

        try {
            const { loanId, customerId, overdraftLimit, status, createdAt } = event.payload;
            const savingsAccountPayload: SavingAccountPayload = { loanId, customerId, overdraftLimit, status, createdAt };

            const response = await this.fineractSavingsController.createAndAprroveAndActivateSavingsAccount(savingsAccountPayload);

            logger.info('Savings account created successfully', {
                eventId: event.eventId,
                payload: event.payload,
                response,
            });

            // Business logic for savings account created
            // Example: Sync with Fineract, update customer records, trigger notifications
            // TODO: Implement actual business logic
        } catch (error) {
            logger.error('Error handling savings account created', {
                eventId: event.eventId,
                payload: event.payload,
                error,
            });
            throw error;
        }
    }

    private async handleSavingsAccountUpdated(event: IEvent): Promise<void> {
        logger.info('Handling savings account updated', {
            eventId: event.eventId,
            payload: event.payload,
        });

        // Business logic for savings account updated
        // Example: Sync changes with Fineract, update analytics
        // TODO: Implement actual business logic
    }

    private async handleSavingsAccountDeleted(event: IEvent): Promise<void> {
        logger.info('Handling savings account deleted', {
            eventId: event.eventId,
            payload: event.payload,
        });

        // Business logic for savings account deleted
        // Example: Archive records, update customer status, trigger cleanup workflows
        // TODO: Implement actual business logic
    }
}
