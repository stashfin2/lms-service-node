/**
 * Consumer Manager Service
 * Manages lifecycle of all Kafka consumers
 * Follows Facade Pattern and Single Responsibility Principle
 */

import { singleton, inject, container } from 'tsyringe';
import { ConsumerFactory } from '../factories/ConsumerFactory';
import { IConsumer } from '../interfaces/IConsumer';
import { CONSUMER_GROUP_CONFIGS } from '../../config/kafka.config';
import {
  LoanMessageHandler,
  DisbursementMessageHandler,
  CustomerMessageHandler,
  PaymentMessageHandler,
  FineractSyncMessageHandler,
  AuditMessageHandler,
  ErrorMessageHandler,
  SavingsAccountMessageHandler,
} from '../handlers';
import { logger } from '../../utils/logger';

@singleton()
export class ConsumerManager {
  private consumers: IConsumer[] = [];
  private initialized: boolean = false;

  constructor(
    @inject(ConsumerFactory) private consumerFactory: ConsumerFactory
  ) {}

  /**
   * Initialize all consumers with their handlers
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('ConsumerManager already initialized');
      return;
    }

    try {
      logger.info('Initializing ConsumerManager');

      // Create consumers for each consumer group
      this.createLoanConsumer();
      this.createDisbursementConsumer();
      this.createCustomerConsumer();
      this.createPaymentConsumer();
      this.createFineractSyncConsumer();
      this.createAuditConsumer();
      this.createErrorConsumer();
      this.createSavingsAccountConsumer();

      this.initialized = true;
      logger.info('ConsumerManager initialized successfully', {
        consumerCount: this.consumers.length,
      });
    } catch (error) {
      logger.error('Failed to initialize ConsumerManager', { error });
      throw error;
    }
  }

  /**
   * Start all consumers
   */
  public async startAll(): Promise<void> {
    if (!this.initialized) {
      throw new Error('ConsumerManager not initialized. Call initialize() first.');
    }

    try {
      logger.info('Starting all consumers', { count: this.consumers.length });

      // Connect all consumers
      await this.consumerFactory.connectAll();

      // Subscribe all consumers to their topics
      await this.consumerFactory.subscribeAll();

      logger.info('All consumers started successfully', { count: this.consumers.length });
    } catch (error) {
      logger.error('Failed to start consumers', { error });
      throw error;
    }
  }

  /**
   * Stop all consumers
   */
  public async stopAll(): Promise<void> {
    if (!this.initialized) {
      logger.warn('ConsumerManager not initialized');
      return;
    }

    try {
      logger.info('Stopping all consumers', { count: this.consumers.length });
      await this.consumerFactory.disconnectAll();
      this.consumers = [];
      this.initialized = false;
      logger.info('All consumers stopped successfully');
    } catch (error) {
      logger.error('Failed to stop consumers', { error });
      throw error;
    }
  }

  /**
   * Pause all consumers
   */
  public async pauseAll(): Promise<void> {
    logger.info('Pausing all consumers');
    await Promise.all(this.consumers.map(consumer => consumer.pause()));
  }

  /**
   * Resume all consumers
   */
  public async resumeAll(): Promise<void> {
    logger.info('Resuming all consumers');
    await Promise.all(this.consumers.map(consumer => consumer.resume()));
  }

  /**
   * Get health status
   */
  public getHealthStatus(): {
    initialized: boolean;
    totalConsumers: number;
    connectedConsumers: number;
  } {
    return {
      initialized: this.initialized,
      totalConsumers: this.consumers.length,
      connectedConsumers: this.consumers.filter(c => c.isConnected()).length,
    };
  }

  // Private methods for creating specific consumers

  private createLoanConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.LOAN_PROCESSOR;
    const handler = container.resolve(LoanMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Loan consumer created', { groupId: config.groupId, topics: config.topics });
  }

  private createDisbursementConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.DISBURSEMENT_PROCESSOR;
    const handler = container.resolve(DisbursementMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Disbursement consumer created', { groupId: config.groupId, topics: config.topics });
  }

  private createCustomerConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.CUSTOMER_PROCESSOR;
    const handler = container.resolve(CustomerMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Customer consumer created', { groupId: config.groupId, topics: config.topics });
  }

  private createPaymentConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.PAYMENT_PROCESSOR;
    const handler = container.resolve(PaymentMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Payment consumer created', { groupId: config.groupId, topics: config.topics });
  }

  private createFineractSyncConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.FINERACT_SYNC_PROCESSOR;
    const handler = container.resolve(FineractSyncMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Fineract sync consumer created', { groupId: config.groupId, topics: config.topics });
  }

  private createAuditConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.AUDIT_PROCESSOR;
    const handler = container.resolve(AuditMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Audit consumer created', { groupId: config.groupId, topics: config.topics });
  }

  private createErrorConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.ERROR_PROCESSOR;
    const handler = container.resolve(ErrorMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('Error consumer created', { groupId: config.groupId, topics: config.topics });
  }
  private createSavingsAccountConsumer(): void {
    const config = CONSUMER_GROUP_CONFIGS.FINERACT_SAVINGS_PROCESSOR;
    const handler = container.resolve(SavingsAccountMessageHandler);
    const consumer = this.consumerFactory.createConsumer(
      config.groupId,
      config.topics,
      handler
    );
    this.consumers.push(consumer);
    logger.info('SavingsAccount consumer created', { groupId: config.groupId, topics: config.topics });
  }
}

