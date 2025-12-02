/**
 * Kafka Configuration
 * Centralized configuration for all Kafka topics and settings
 * Follows Single Responsibility Principle - only handles configuration
 */

export enum KafkaTopics {
  // LMS Domain Topics
  LOAN_APPLICATION_CREATED = 'lms.loan.application.created',
  LOAN_APPLICATION_UPDATED = 'lms.loan.application.updated',
  LOAN_APPLICATION_APPROVED = 'lms.loan.application.approved',
  LOAN_APPLICATION_REJECTED = 'lms.loan.application.rejected',
  
  LOAN_DISBURSEMENT_INITIATED = 'lms.loan.disbursement.initiated',
  LOAN_DISBURSEMENT_COMPLETED = 'lms.loan.disbursement.completed',
  LOAN_DISBURSEMENT_FAILED = 'lms.loan.disbursement.failed',
  
  CUSTOMER_CREATED = 'lms.customer.created',
  CUSTOMER_UPDATED = 'lms.customer.updated',
  CUSTOMER_KYC_COMPLETED = 'lms.customer.kyc.completed',
  
  PAYMENT_RECEIVED = 'lms.payment.received',
  PAYMENT_FAILED = 'lms.payment.failed',
  
  // Fineract Integration Topics
  FINERACT_CLIENT_SYNC = 'lms.fineract.client.sync',
  FINERACT_LOAN_SYNC = 'lms.fineract.loan.sync',
  FINERACT_TRANSACTION_SYNC = 'lms.fineract.transaction.sync',
  
  // System Topics
  AUDIT_LOG = 'lms.system.audit.log',
  ERROR_LOG = 'lms.system.error.log',

  // Savings Integration Topics
  FINERACT_SAVINGS_CREATED = 'lms.fineract.savings.created',
  FINERACT_SAVINGS_UPDATED = 'lms.fineract.savings.updated',
  FINERACT_SAVINGS_DELETED = 'lms.fineract.savings.deleted'
}

export interface TopicConfiguration {
  topic: KafkaTopics;
  numPartitions?: number;
  replicationFactor?: number;
  configEntries?: Array<{ name: string; value: string }>;
}

/**
 * Topic configurations for auto-creation or validation
 */
export const TOPIC_CONFIGURATIONS: TopicConfiguration[] = [
  {
    topic: KafkaTopics.LOAN_APPLICATION_CREATED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.LOAN_APPLICATION_UPDATED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.LOAN_APPLICATION_APPROVED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.LOAN_APPLICATION_REJECTED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.LOAN_DISBURSEMENT_INITIATED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.LOAN_DISBURSEMENT_COMPLETED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.LOAN_DISBURSEMENT_FAILED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.CUSTOMER_CREATED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.CUSTOMER_UPDATED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.CUSTOMER_KYC_COMPLETED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.PAYMENT_RECEIVED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.PAYMENT_FAILED,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.FINERACT_CLIENT_SYNC,
    numPartitions: 2,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.FINERACT_LOAN_SYNC,
    numPartitions: 2,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.FINERACT_TRANSACTION_SYNC,
    numPartitions: 2,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.AUDIT_LOG,
    numPartitions: 5,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.ERROR_LOG,
    numPartitions: 3,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.FINERACT_SAVINGS_CREATED,
    numPartitions: 2,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.FINERACT_SAVINGS_UPDATED,
    numPartitions: 2,
    replicationFactor: 2,
  },
  {
    topic: KafkaTopics.FINERACT_SAVINGS_DELETED,
    numPartitions: 2,
    replicationFactor: 2,
  },
];

/**
 * Consumer group configurations for different topic subscriptions
 */
export const CONSUMER_GROUP_CONFIGS = {
  LOAN_PROCESSOR: {
    groupId: 'lms-loan-processor-group',
    topics: [
      KafkaTopics.LOAN_APPLICATION_CREATED,
      KafkaTopics.LOAN_APPLICATION_UPDATED,
      KafkaTopics.LOAN_APPLICATION_APPROVED,
      KafkaTopics.LOAN_APPLICATION_REJECTED,
    ],
  },
  DISBURSEMENT_PROCESSOR: {
    groupId: 'lms-disbursement-processor-group',
    topics: [
      KafkaTopics.LOAN_DISBURSEMENT_INITIATED,
      KafkaTopics.LOAN_DISBURSEMENT_COMPLETED,
      KafkaTopics.LOAN_DISBURSEMENT_FAILED,
    ],
  },
  CUSTOMER_PROCESSOR: {
    groupId: 'lms-customer-processor-group',
    topics: [
      KafkaTopics.CUSTOMER_CREATED,
      KafkaTopics.CUSTOMER_UPDATED,
      KafkaTopics.CUSTOMER_KYC_COMPLETED,
    ],
  },
  PAYMENT_PROCESSOR: {
    groupId: 'lms-payment-processor-group',
    topics: [
      KafkaTopics.PAYMENT_RECEIVED,
      KafkaTopics.PAYMENT_FAILED,
    ],
  },
  FINERACT_SYNC_PROCESSOR: {
    groupId: 'lms-fineract-sync-group',
    topics: [
      KafkaTopics.FINERACT_CLIENT_SYNC,
      KafkaTopics.FINERACT_LOAN_SYNC,
      KafkaTopics.FINERACT_TRANSACTION_SYNC,
    ],
  },
  AUDIT_PROCESSOR: {
    groupId: 'lms-audit-processor-group',
    topics: [
      KafkaTopics.AUDIT_LOG,
    ],
  },
  ERROR_PROCESSOR: {
    groupId: 'lms-error-processor-group',
    topics: [
      KafkaTopics.ERROR_LOG,
    ],
  },
  FINERACT_SAVINGS_PROCESSOR: {
    groupId: 'lms-fineract-savings-processor-group',
    topics: [
      KafkaTopics.FINERACT_SAVINGS_CREATED,
      KafkaTopics.FINERACT_SAVINGS_UPDATED,
      KafkaTopics.FINERACT_SAVINGS_DELETED,
    ],
  },
};

