import { Router } from 'express';
import { container } from 'tsyringe';
import { LmsControllerV1 } from '../controllers/lms.controller.v1';
import { FineractControllerV1 } from '../controllers/fineract.controller.v1';
import { KafkaMonitoringController } from '../controllers/kafka-monitoring.controller';
import { EventPublisher, ConsumerManager } from '../kafka/services';

const router = Router();

// Initialize controllers from DI container
const lmsController = container.resolve(LmsControllerV1);
const fineractController = container.resolve(FineractControllerV1);
const kafkaMonitoringController = container.resolve(KafkaMonitoringController);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'lms-service',
    timestamp: new Date().toISOString(),
  });
});

// Kafka health check
router.get('/health/kafka', (req, res) => {
  try {
    const eventPublisher = container.resolve(EventPublisher);
    const consumerManager = container.resolve(ConsumerManager);

    const publisherHealth = eventPublisher.getHealthStatus();
    const consumerHealth = consumerManager.getHealthStatus();

    res.json({
      status: publisherHealth.initialized && consumerHealth.initialized ? 'healthy' : 'unhealthy',
      kafka: {
        producers: publisherHealth,
        consumers: consumerHealth,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ==================== LMS Routes ====================

// Customer Management
router.post('/v1/lms/customers', lmsController.createCustomer);

// Loan Application Management
router.post('/v1/lms/loan-applications', lmsController.createLoanApplication);
router.put('/v1/lms/loan-applications/:applicationId/approve', lmsController.approveLoanApplication);

// Disbursement Management
router.post('/v1/lms/disbursements', lmsController.initiateDisbursement);

// Payment Management
router.post('/v1/lms/payments', lmsController.recordPayment);


router.post('/v1/lms/savings-accounts', lmsController.createAndAprroveAndActivateSavingsAccount);

// ==================== Kafka Monitoring Routes ====================

// Dashboard and Overview
router.get('/v1/kafka/dashboard', kafkaMonitoringController.getDashboard);
router.get('/v1/kafka/status', kafkaMonitoringController.getKafkaStatus);

// Consumer Groups
router.get('/v1/kafka/consumer-groups', kafkaMonitoringController.getConsumerGroups);
router.get('/v1/kafka/consumer-groups/:groupId', kafkaMonitoringController.getConsumerGroup);
router.get('/v1/kafka/consumer-groups/:groupId/health', kafkaMonitoringController.getConsumerHealth);
router.post('/v1/kafka/consumer-groups/:groupId/pause', kafkaMonitoringController.pauseConsumerGroup);
router.post('/v1/kafka/consumer-groups/:groupId/resume', kafkaMonitoringController.resumeConsumerGroup);

// Messages
router.get('/v1/kafka/messages', kafkaMonitoringController.getMessages);

// Errors
router.get('/v1/kafka/errors', kafkaMonitoringController.getErrors);
router.get('/v1/kafka/errors/unacknowledged', kafkaMonitoringController.getUnacknowledgedErrors);
router.put('/v1/kafka/errors/:errorId/acknowledge', kafkaMonitoringController.acknowledgeError);

// Metrics
router.get('/v1/kafka/metrics', kafkaMonitoringController.getMetrics);

// ==================== Fineract Routes ====================

// Fineract routes - placeholder
// Example: router.get('/v1/fineract/clients', fineractController.getClients.bind(fineractController));

export default router;

