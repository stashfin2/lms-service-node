import { Router } from 'express';
import { container } from 'tsyringe';
import { LmsControllerV1 } from '../controllers/lms.controller.v1';
import { FineractControllerV1 } from '../controllers/fineract.controller.v1';

const router = Router();

// Initialize controllers from DI container
const lmsController = container.resolve(LmsControllerV1);
const fineractController = container.resolve(FineractControllerV1);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lms-service' });
});

// LMS routes - placeholder
// Example: router.post('/v1/lms/loan', lmsController.createLoan.bind(lmsController));

// Fineract routes - placeholder
// Example: router.get('/v1/fineract/clients', fineractController.getClients.bind(fineractController));

export default router;

