import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { LmsServiceV1 } from '../services/lms.service.v1';
import { EventPublisher } from '../kafka/services/EventPublisher';
import {
  LoanApplicationCreatedEvent,
  LoanApplicationApprovedEvent,
  LoanDisbursementInitiatedEvent,
  CustomerCreatedEvent,
  PaymentReceivedEvent,
} from '../kafka/events';
import { KafkaTopics } from '../config/kafka.config';
import { logger } from '../utils/logger';

@injectable()
export class LmsControllerV1 {
  constructor(
    @inject(LmsServiceV1) private lmsService: LmsServiceV1,
    @inject(EventPublisher) private eventPublisher: EventPublisher
  ) {}

  /**
   * Create a new loan application
   * Demonstrates publishing a loan application created event
   */
  public createLoanApplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, loanAmount, loanPurpose, loanTerm, interestRate } = req.body;

      // Business logic - create loan application
      const applicationId = `LA-${Date.now()}`;
      
      logger.info('Creating loan application', { applicationId, customerId });

      // Publish event to Kafka
      const event = new LoanApplicationCreatedEvent(
        {
          applicationId,
          customerId,
          loanAmount,
          loanPurpose,
          loanTerm,
          interestRate,
          status: 'PENDING',
          appliedAt: new Date(),
        },
        {
          correlationId: req.headers['x-correlation-id'] as string,
          triggeredBy: (req as any).user?.id || 'system',
        }
      );

      await this.eventPublisher.publish(
        KafkaTopics.LOAN_APPLICATION_CREATED,
        event,
        customerId
      );

      res.status(201).json({
        success: true,
        data: {
          applicationId,
          customerId,
          loanAmount,
          status: 'PENDING',
          message: 'Loan application created successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error creating loan application', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Approve a loan application
   * Demonstrates publishing a loan application approved event
   */
  public approveLoanApplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { approvedBy, approvalNotes } = req.body;

      logger.info('Approving loan application', { applicationId });

      // Mock application data (in real scenario, fetch from database)
      const applicationData = {
        applicationId,
        customerId: 'CUST-123',
        loanAmount: 50000,
        loanPurpose: 'Business',
        loanTerm: 12,
        status: 'APPROVED',
        appliedAt: new Date(),
      };

      // Publish event to Kafka
      const event = new LoanApplicationApprovedEvent(
        {
          ...applicationData,
          approvedBy: approvedBy || 'admin',
          approvedAt: new Date(),
          approvalNotes,
        },
        {
          correlationId: req.headers['x-correlation-id'] as string,
          triggeredBy: approvedBy || 'admin',
        }
      );

      await this.eventPublisher.publish(
        KafkaTopics.LOAN_APPLICATION_APPROVED,
        event,
        applicationData.customerId
      );

      res.status(200).json({
        success: true,
        data: {
          applicationId,
          status: 'APPROVED',
          message: 'Loan application approved successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error approving loan application', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Initiate loan disbursement
   * Demonstrates publishing a disbursement initiated event
   */
  public initiateDisbursement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId, amount, bankAccount } = req.body;

      const disbursementId = `DISB-${Date.now()}`;
      const customerId = 'CUST-123'; // In real scenario, fetch from loan data

      logger.info('Initiating loan disbursement', { disbursementId, loanId });

      // Publish event to Kafka
      const event = new LoanDisbursementInitiatedEvent(
        {
          disbursementId,
          loanId,
          customerId,
          amount,
          bankAccount: {
            accountNumber: bankAccount.accountNumber,
            ifscCode: bankAccount.ifscCode,
            accountHolderName: bankAccount.accountHolderName,
          },
          status: 'INITIATED',
          initiatedAt: new Date(),
        },
        {
          correlationId: req.headers['x-correlation-id'] as string,
          triggeredBy: (req as any).user?.id || 'system',
        }
      );

      await this.eventPublisher.publish(
        KafkaTopics.LOAN_DISBURSEMENT_INITIATED,
        event,
        customerId
      );

      res.status(200).json({
        success: true,
        data: {
          disbursementId,
          loanId,
          status: 'INITIATED',
          message: 'Loan disbursement initiated successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error initiating disbursement', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Create a new customer
   * Demonstrates publishing a customer created event
   */
  public createCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, phone, dateOfBirth, address } = req.body;

      const customerId = `CUST-${Date.now()}`;

      logger.info('Creating customer', { customerId, email });

      // Publish event to Kafka
      const event = new CustomerCreatedEvent(
        {
          customerId,
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          status: 'ACTIVE',
          createdAt: new Date(),
        },
        {
          correlationId: req.headers['x-correlation-id'] as string,
          triggeredBy: 'system',
        }
      );

      await this.eventPublisher.publish(
        KafkaTopics.CUSTOMER_CREATED,
        event,
        customerId
      );

      res.status(201).json({
        success: true,
        data: {
          customerId,
          firstName,
          lastName,
          email,
          status: 'ACTIVE',
          message: 'Customer created successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error creating customer', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Record a payment
   * Demonstrates publishing a payment received event
   */
  public recordPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        loanId,
        amount,
        paymentMethod,
        principalAmount,
        interestAmount,
        lateFeeAmount,
        outstandingBalance,
      } = req.body;

      const paymentId = `PAY-${Date.now()}`;
      const customerId = 'CUST-123'; // In real scenario, fetch from loan data

      logger.info('Recording payment', { paymentId, loanId });

      // Publish event to Kafka
      const event = new PaymentReceivedEvent(
        {
          paymentId,
          loanId,
          customerId,
          amount,
          paymentMethod,
          paymentStatus: 'SUCCESS',
          transactionReference: `TXN-${Date.now()}`,
          paymentDate: new Date(),
          principalAmount,
          interestAmount,
          lateFeeAmount,
          outstandingBalance,
        },
        {
          correlationId: req.headers['x-correlation-id'] as string,
          triggeredBy: (req as any).user?.id || 'system',
        }
      );

      await this.eventPublisher.publish(
        KafkaTopics.PAYMENT_RECEIVED,
        event,
        customerId
      );

      res.status(200).json({
        success: true,
        data: {
          paymentId,
          loanId,
          amount,
          status: 'SUCCESS',
          message: 'Payment recorded successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error recording payment', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

